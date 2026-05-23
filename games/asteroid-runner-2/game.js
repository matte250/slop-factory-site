// Simple endless runner on canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // player ship
  const ship = { x: 50, y: height / 2, w: 20, h: 10, dy: 0 };
  // audio context and sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration);
  }
  function startThrust() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.type = 'square';
    thrustOsc.frequency.value = 150;
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.start();
  }
  function stopThrust() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCollision() { playTone(80, 200, 'sawtooth'); }
  function playPowerUp() { playTone(600, 150, 'triangle'); }
  function playGameOver() { playTone(40, 500, 'sine'); }

  // game state
  let asteroids = [];
  let powerUps = [];
  let fuel = 100;
  let shield = false;
  let lastSpawn = 0;
  const speed = 2; // world scroll speed

  // input
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width + size, y: Math.random() * (height - size), w: size, h: size, vx: -speed - Math.random() * 2 });
  }
  function spawnPowerUp() {
    powerUps.push({ x: width + 20, y: Math.random() * (height - 20), type: Math.random() < 0.5 ? 'fuel' : 'shield', vx: -speed });
  }

  function update(dt) {
    updateStars(dt);
    // ship control with thrust sound
    if (keys.ArrowUp) { ship.dy = -3; startThrust(); }
    else if (keys.ArrowDown) { ship.dy = 3; startThrust(); }
    else { if (ship.dy !== 0) stopThrust(); ship.dy = 0; }
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // fuel consumption
    fuel -= dt * 0.01;
    if (fuel <= 0) gameOver();

    // spawn logic
    if (performance.now() - lastSpawn > 800) {
      spawnAsteroid();
      if (Math.random() < 0.1) spawnPowerUp();
      lastSpawn = performance.now();
    }

    // move asteroids & power-ups
    asteroids.forEach(a => a.x += a.vx);
    powerUps.forEach(p => p.x += p.vx);
    // remove off‑screen
    asteroids = asteroids.filter(a => a.x + a.w > 0);
    powerUps = powerUps.filter(p => p.x > 0);

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (rectCollide(ship, a)) {
        playCollision();
        if (shield) shield = false; else gameOver();
        asteroids.splice(i, 1);
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (rectCollide(ship, { x: p.x, y: p.y, w: 15, h: 15 })) {
        playPowerUp();
        if (p.type === 'fuel') fuel = Math.min(100, fuel + 30);
        else if (p.type === 'shield') shield = true;
        powerUps.splice(i, 1);
      }
    }
  }

  function rectCollide(r1, r2) {
    return !(r1.x > r2.x + r2.w || r1.x + r1.w < r2.x || r1.y > r2.y + r2.h || r1.y + r1.h < r2.y);
  }

function draw() {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#000011');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    drawStars();
    // ship (triangle) with optional thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y + ship.h / 2);
    ctx.fillStyle = shield ? '#00ffff' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w, ship.h / 2);
    ctx.lineTo(ship.w, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving vertically
    if (ship.dy !== 0) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(0, ship.h / 2);
      ctx.lineTo(-ship.w / 2, ship.h / 2 + 8);
      ctx.lineTo(ship.w / 2, ship.h / 2 + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // asteroids (circles with gradient and rotation)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.save();
      const angle = (a.x + a.y) % (Math.PI * 2);
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // power‑ups (circles with distinct colors)
    powerUps.forEach(p => {
      ctx.fillStyle = p.type === 'fuel' ? '#0f0' : '#ff0';
      ctx.beginPath();
      ctx.arc(p.x + 7.5, p.y + 7.5, 7.5, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}`, 10, 20);
    if (shield) ctx.fillText('Shield', 10, 40);
  }

  function gameOver() {
    cancelAnimationFrame(rAF);
    playGameOver();
    ctx.fillStyle = 'red';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', width / 2 - 80, height / 2);
  }

  // star field
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 0.5, speed: 0.5 + Math.random() * 0.5 });
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function updateStars(dt) {
    stars.forEach(s => {
      s.x -= s.speed * (dt / 16);
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    });
  }

  let last = performance.now();
  let rAF;
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    rAF = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
