// Minimal Asteroid Dodge game based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let musicOsc = null;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function startMusic() {
    musicOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    musicOsc.frequency.value = 150;
    musicOsc.type = 'sine';
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    musicOsc.connect(gain).connect(audioCtx.destination);
    musicOsc.start();
  }
  function stopMusic() {
    if (musicOsc) {
      musicOsc.stop();
      musicOsc.disconnect();
      musicOsc = null;
    }
  }
  function playThrust() { playTone(400, 100); }
  function playExplosion() { playTone(100, 300); }
  // Start background music on user interaction (required by browsers)
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!musicOsc) startMusic();
  }, { once: true });
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.w, this.x + this.speed);
    }
  };

  // Asteroids
  const asteroids = [];
  // Starfield for background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 1.5
    });
  }
  const asteroidSpawnInterval = 1000; // ms
  const asteroidSpeed = 2;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, size, speed: asteroidSpeed + Math.random() * 2 });
  }

  let lastSpawn = 0;
  let gameOver = false;

  function update(delta) {
    if (gameOver) return;
    ship.update();
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }
    // Collision detection
    for (const a of asteroids) {
      if (
        a.x < ship.x + ship.w &&
        a.x + a.size > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.size > ship.y
      ) {
        playExplosion();
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#090b2d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw moving stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 2, 2);
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Draw ship with gradient
    ship.draw();

    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#999');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      if (timestamp - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
    }
    update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { ship.moveLeft = true; playThrust(); }
    if (e.key === 'ArrowRight') { ship.moveRight = true; playThrust(); }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  // Start game loop
  requestAnimationFrame(loop);
})();
