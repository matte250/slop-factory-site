// Simple Space Junk Escape game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
// Arrow keys or WASD move the ship; debris scroll leftward.
// Score = seconds survived.
// Added starfield background, gradient ship, rotating debris.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction (required by browsers)
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  // Background ambient tone
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30; // low hum
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();
  // Collision sound helper
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Ship definition
  const ship = {
    x: width * 0.1,
    y: height / 2,
    w: 20,
    h: 20,
    speed: 3,
    color: '#0ff',
  };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Debris pool
  const debris = [];
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;
  const debrisSpeed = 2;

  let startTime = performance.now();
  let gameOver = false;

  function spawnDebris() {
    const size = Math.random() * 30 + 10;
    debris.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      color: '#666',
      angle: Math.random() * Math.PI * 2,
    });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Update starfield
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }

    // Spawn debris
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // Move and rotate debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x -= debrisSpeed;
      d.angle += 0.02; // rotate slowly
      if (d.x + d.w < 0) debris.splice(i, 1);
    }

    // Collision detection
    for (const d of debris) {
      if (
        ship.x < d.x + d.w &&
        ship.x + ship.w > d.x &&
        ship.y < d.y + d.h &&
        ship.y + ship.h > d.y
      ) {
        gameOver = true;
        playCollisionSound();
        break;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Draw ship as gradient triangle
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    const shipGrad = ctx.createLinearGradient(-ship.w / 2, -ship.h / 2, ship.w / 2, ship.h / 2);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.lineTo(0, -ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw rotating debris as rectangles
    for (const d of debris) {
      ctx.save();
      ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
      ctx.rotate(d.angle);
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${seconds}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame;
  requestAnimationFrame(loop);
})();
