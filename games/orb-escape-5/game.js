// Orb Escape – enhanced graphics with sounds
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  function playCollectSound() { beep(800, 100); }
  function playCollisionSound() { beep(200, 300); }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // ----- Background starfield (static) -----
  const bgStars = [];
  for (let i = 0; i < 100; i++) {
    bgStars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }
  function drawBackground() {
    // Dark space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Small static stars
    ctx.fillStyle = '#fff';
    for (const s of bgStars) {
      ctx.globalAlpha = s.opacity;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 12, // half‑width of triangle
    speed: 2.5,
    angle: 0,
    color: '#0ff',
  };

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Orbs (hazards) -----
  const orbs = [];
  const maxOrbs = 30;
  function spawnOrb() {
    const size = 15 + Math.random() * 10;
    const speed = 1 + Math.random() * 1.5;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.random() * width;
    const y = -size;
    // radial gradient colors for glow effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, 'rgba(255,50,50,0.9)');
    gradient.addColorStop(1, 'rgba(200,0,0,0.2)');
    orbs.push({ x, y, size, speed, angle, gradient });
  }

  // ----- Stars (collectibles) -----
  const stars = [];
  const maxStars = 20;
  function spawnStar() {
    const size = 4 + Math.random() * 2;
    const x = Math.random() * width;
    const y = -size;
    const speed = 1.5;
    stars.push({ x, y, size, speed, opacity: 1 });
  }

  let lastSpawn = 0;
  let lastStar = 0;
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  function update(dt) {
    // Ship movement & orientation
    ship.angle = 0;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep within bounds
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y));

    // Spawn orbs
    if (orbs.length < maxOrbs && performance.now() - lastSpawn > 800) {
      spawnOrb();
      lastSpawn = performance.now();
    }
    // Spawn stars
    if (stars.length < maxStars && performance.now() - lastStar > 1500) {
      spawnStar();
      lastStar = performance.now();
    }

    // Move orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.speed * Math.sin(o.angle) * dt * 0.06;
      o.x += o.speed * Math.cos(o.angle) * dt * 0.06;
      if (o.y - o.size > height) orbs.splice(i, 1);
    }
    // Move stars and flicker
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed * dt * 0.06;
      // simple flicker
      s.opacity = 0.6 + Math.random() * 0.4;
      if (s.y - s.size > height) stars.splice(i, 1);
    }

    // Collision detection – game over
    for (const o of orbs) {
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size + o.size) {
        playCollisionSound();
        gameOver = true;
      }
    }
    // Collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = ship.x - s.x;
      const dy = ship.y - s.y;
      if (Math.hypot(dx, dy) < ship.size + s.size) {
        score++;
        playCollectSound();
        stars.splice(i, 1);
      }
    }

    // 60‑second timer limit
    if (performance.now() - startTime > 60000) gameOver = true;
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.atan2(
      (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0),
      (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)
    ));
    // glow
    ctx.shadowColor = ship.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size, ship.size);
    ctx.lineTo(-ship.size, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function draw() {
    drawBackground();
    // Orbs with gradient glow
    for (const o of orbs) {
      ctx.fillStyle = o.gradient;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Stars (collectibles) with flicker
    for (const s of stars) {
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Ship
    drawShip();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    const timeLeft = Math.max(0, Math.floor((60000 - (performance.now() - startTime)) / 1000));
    ctx.fillText('Time: ' + timeLeft, width - 80, 20);
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
      return;
    }
    const dt = timestamp - (lastRender || timestamp);
    lastRender = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastRender;
  requestAnimationFrame(loop);
})();
