// Cosmic Dodge – simple canvas game
// Target canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context resumes on user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  // Starfield for background
  const stars = [];
  const starCount = 100;
  function createStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    };
  }
  for (let i = 0; i < starCount; i++) stars.push(createStar());
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  const ship = {
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 5,
    shield: false,
    shieldTimer: 0,
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, this.shield ? '#00ffff' : '#00aaff');
      grad.addColorStop(1, this.shield ? '#0066ff' : '#0011aa');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const asteroids = [];
  const asteroidSpawnRate = 60; // frames
  let frameCount = 0;
  let score = 0;
  let lastTime = performance.now();

  function spawnAsteroid() {
    // Play asteroid spawn sound
    playTone(300, 0.05);
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size,
      speed: Math.random() * 2 + 1
    });
  }

  function update() {
    // Update starfield
    stars.forEach(s => s.y += s.speed);
    // Recycle stars that go off screen
    for (let i = stars.length - 1; i >= 0; i--) {
      if (stars[i].y > height) {
        stars.splice(i, 1);
        stars.push(createStar());
      }
    }

    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // Update shield timer
    if (ship.shield) {
      ship.shieldTimer -= 1;
      if (ship.shieldTimer <= 0) ship.shield = false;
    }

    // Spawn asteroids
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();

    // Move asteroids and check collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
      // Collision with ship (simple AABB vs circle)
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const distX = Math.abs(a.x + a.r - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y + a.r - (shipRect.y + shipRect.h / 2));
      if (distX <= (shipRect.w / 2 + a.r) && distY <= (shipRect.h / 2 + a.r)) {
if (ship.shield) {
            // shield destroys asteroid sound
            playTone(400, 0.08);
          asteroids.splice(i, 1); // destroy asteroid
        } else {
          // Game over
          playTone(200, 0.5);
            cancelAnimationFrame(animId);
          ctx.fillStyle = 'red';
          ctx.font = '48px sans-serif';
          ctx.fillText('Game Over', width / 2 - 120, height / 2);
          return;
        }
      }
    }

    // Simple power‑up: every 10 seconds grant shield for 3 seconds
    if (frameCount % (10 * 60) === 0) {
      // Play shield power‑up sound
      playTone(800, 0.15);
      ship.shield = true;
      ship.shieldTimer = 180; // 3 seconds at 60fps
    }
  }

  function draw() {
    // Fill background
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, width, height);
  // Draw stars
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // Clear remaining area (not needed as background covers all)
    // Draw ship
    ship.draw();
    // Draw asteroids
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      // Asteroid gradient
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.2, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
    // Draw shield indicator
    if (ship.shield) {
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 2;
      ctx.strokeRect(ship.x - 2, ship.y - 2, ship.w + 4, ship.h + 4);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    score += delta / 1000; // seconds
    update();
    draw();
    frameCount++;
    animId = requestAnimationFrame(loop);
  }
  let animId = requestAnimationFrame(loop);
})();
