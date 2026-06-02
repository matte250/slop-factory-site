// Simple Astro Escape game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // star field background
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.4 + 0.1
    });
  }

  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playPowerUp() { playTone(800, 200, 'triangle'); }
  function playExplosion() { playTone(120, 400, 'sawtooth'); }
  function playThrust() { playTone(400, 100, 'sawtooth'); }

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 30,
    speed: 4,
    dx: 0,
    dy: 0,
draw() {
        // Ship with subtle gradient
        const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y, this.x + this.w / 2, this.y + this.h);
        grad.addColorStop(0, '#0ff');
        grad.addColorStop(1, '#0055ff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.w / 2, this.y + this.h);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        ctx.closePath();
        ctx.fill();
      }
  };

  // Input handling
  const keys = {};
  addEventListener('keydown', e => (keys[e.key] = true));
  addEventListener('keyup', e => (keys[e.key] = false));

  // Obstacles & power‑ups
  const asteroids = [];
  const powerUps = [];

  const spawnAsteroid = () => {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3
    });
  };

  const spawnPowerUp = () => {
    const size = 20;
    powerUps.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 1.5,
      active: false,
      timer: 0
    });
  };

  let frame = 0;
  let score = 0;
  let invincible = false;
  let invincibilityTimer = 0;
  let gameOver = false;

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;

    // Move ship based on input
    ship.dx = (keys['ArrowLeft'] || keys['a']) ? -ship.speed : (keys['ArrowRight'] || keys['d']) ? ship.speed : 0;
    ship.dy = (keys['ArrowUp'] || keys['w']) ? -ship.speed : (keys['ArrowDown'] || keys['s']) ? ship.speed : 0;
    // play thrust sound when moving
    if (ship.dx !== 0 || ship.dy !== 0) playThrust();
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // Spawn obstacles/power‑ups
    if (frame % 60 === 0) spawnAsteroid(); // roughly one per second at 60fps
    if (frame % 600 === 0) spawnPowerUp(); // every 10 seconds

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) { asteroids.splice(i, 1); score++; }
      else if (!invincible && rectIntersect(a, ship)) { gameOver = true; }
    }

    // Update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y > height) { powerUps.splice(i, 1); }
      else if (rectIntersect(p, ship)) {
        invincible = true;
        p.timer = 300; // 5 seconds at 60fps
        powerUps.splice(i, 1);
      }
    }
    if (invincible) {
      if (powerUps.length && powerUps[0].timer) {
        powerUps[0].timer--;
        if (powerUps[0].timer <= 0) invincible = false;
      }
    }

    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001021');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // star field (moving)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });

    // ship
    ship.draw();

    // asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // power‑ups (glowing)
    powerUps.forEach(p => {
      const puGrad = ctx.createRadialGradient(
        p.x + p.w / 2,
        p.y + p.h / 2,
        p.w * 0.1,
        p.x + p.w / 2,
        p.y + p.h / 2,
        p.w / 2
      );
      puGrad.addColorStop(0, invincible ? '#ff0' : '#0f0');
      puGrad.addColorStop(1, '#003300');
      ctx.fillStyle = puGrad;
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Press R to Restart', width / 2, height / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  addEventListener('keydown', e => {
    if (gameOver && e.key.toLowerCase() === 'r') {
      // Reset state
      ship.x = width / 2; ship.y = height - 60;
      asteroids.length = 0; powerUps.length = 0; score = 0; frame = 0; invincible = false; gameOver = false;
    }
  });

  loop();
})();
