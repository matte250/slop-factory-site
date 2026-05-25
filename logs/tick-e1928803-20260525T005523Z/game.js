// Simple Asteroid Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // Ship definition
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // Gradient ship body
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#4caf50');
      grad.addColorStop(1, '#1b5e20');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required for some browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    // Play a short move tone for left/right arrows or A/D keys
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') && !keys[e.key]) {
      playTone(300, 0.07);
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const maxSize = 30;

  function spawnAsteroid() {
    const size = Math.random() * maxSize + 10;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -size, size, speed });
  }

  // Collision detection
  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x + circle.r - (rect.x + rect.w / 2));
    const distY = Math.abs(circle.y + circle.r - (rect.y + rect.h / 2));
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  let gameOver = false;
  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    else if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship
      if (rectCircleCollide({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, { x: a.x, y: a.y, r: a.size / 2 })) {
        gameOver = true;
        // Play crash sound
        playTone(150, 0.3);
      }
      // Remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // Update starfield (slow scroll)
    for (const s of stars) {
      s.y += 0.3; // subtle movement
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = 0;
        s.radius = Math.random() * 1.5 + 0.5;
        s.alpha = Math.random() * 0.5 + 0.5;
      }
    }
  }

  function draw() {
    // Dark space background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    }
    // Draw ship
    ship.draw();
    // Draw asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
