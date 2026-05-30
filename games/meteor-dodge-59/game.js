// Meteor Dodge Game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // ---- Audio ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain).connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // ---- Player (spaceship) ----
  const ship = {
    width: 30,
    height: 40,
    x: width / 2 - 15,
    y: height - 50,
    speed: 5,
    dx: 0,
    dy: 0,
    draw() {
      // Draw a stylized ship with gradient fill and a stroke
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#00ff80');
      grad.addColorStop(1, '#006640');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#003320';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside bounds
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > width) this.x = width - this.width;
      if (this.y < 0) this.y = 0;
      if (this.y + this.height > height) this.y = height - this.height;
    }
  };

  // ---- Stars (background) ----
  const stars = [];
  const starCount = 100;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }
  function updateStars() {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = -s.radius;
        s.speed = Math.random() * 0.5 + 0.2;
      }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Meteors ----
  const meteors = [];
  let meteorSpawnInterval = 2000; // ms
  let lastSpawn = 0;
  let meteorSpeed = 2;

  function spawnMeteor() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    meteors.push({ x, y: -radius, radius, speed: meteorSpeed });
    // sound effect for meteor spawn
    playTone(300, 80);
  }

  function updateMeteors(delta) {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (m.y - m.radius > height) {
        meteors.splice(i, 1); // remove off‑screen
      }
    }
  }

  function drawMeteors() {
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
      grad.addColorStop(0, '#ff8c00');
      grad.addColorStop(1, '#8b0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ---- Collision ----
  function collides(meteor) {
    // simple AABB vs circle test
    const shipRect = {
      left: ship.x,
      right: ship.x + ship.width,
      top: ship.y,
      bottom: ship.y + ship.height
    };
    const nearestX = Math.max(shipRect.left, Math.min(meteor.x, shipRect.right));
    const nearestY = Math.max(shipRect.top, Math.min(meteor.y, shipRect.bottom));
    const dx = meteor.x - nearestX;
    const dy = meteor.y - nearestY;
    return dx * dx + dy * dy < meteor.radius * meteor.radius;
  }

  // ---- Input ----
  const keys = {};
  window.addEventListener('keydown', e => {
  // Resume audio context on first user interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    updateDirection();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    updateDirection();
  });

  function updateDirection() {
    ship.dx = 0;
    ship.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
  }

  // ---- Game Loop ----
  let startTime = null;
  let lastTime = 0;
  let gameOver = false;

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // clear background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // update and draw background stars
    updateStars();
    drawStars();

    // spawn meteors based on interval
    if (timestamp - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = timestamp;
      // gradually increase difficulty
      meteorSpawnInterval = Math.max(500, meteorSpawnInterval - 20);
      meteorSpeed += 0.05;
    }

    ship.update();
    ship.draw();

    updateMeteors(delta);
    drawMeteors();

    // collision check
    for (const m of meteors) {
        if (collides(m)) {
          // play collision/explosion sound
          playTone(100, 200);
          gameOver = true;
          break;
        }
    }

    // score
    const survived = ((timestamp - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${survived}s`, 10, 20);

    if (!gameOver) {
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText(`Survived: ${survived}s`, width / 2 - 80, height / 2 + 30);
    }
  }

  // Initialize stars
  initStars();
  // ---- Background music ----
  let bgOsc, bgGain;
  function startMusic() {
    bgOsc = audioCtx.createOscillator();
    bgGain = audioCtx.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 60; // low hum
    bgGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    bgGain.gain.exponentialRampToValueAtTime(0.03, audioCtx.currentTime + 0.5);
    bgOsc.connect(bgGain).connect(audioCtx.destination);
    bgOsc.start();
  }
  function stopMusic() {
    if (bgOsc) {
      bgGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      bgOsc.stop(audioCtx.currentTime + 0.3);
    }
  }
  startMusic();

  // start the loop
  requestAnimationFrame(loop);
})();
