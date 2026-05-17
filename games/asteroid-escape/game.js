// Minimal Asteroid Escape game
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Starfield background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Ship ---
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    angle: 0,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.07,
  };

  // --- Asteroids ---
  const asteroids = [];
  const ASTEROID_MIN_SPEED = 0.5;
  const ASTEROID_MAX_SPEED = 2.0;
  const ASTEROID_MIN_RADIUS = 15;
  const ASTEROID_MAX_RADIUS = 35;
  const SPAWN_INTERVAL = 2000; // ms

  function spawnAsteroid() {
    // spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    switch (edge) {
      case 0: // top
        x = Math.random() * WIDTH;
        y = -ASTEROID_MAX_RADIUS;
        break;
      case 1: // right
        x = WIDTH + ASTEROID_MAX_RADIUS;
        y = Math.random() * HEIGHT;
        break;
      case 2: // bottom
        x = Math.random() * WIDTH;
        y = HEIGHT + ASTEROID_MAX_RADIUS;
        break;
      case 3: // left
        x = -ASTEROID_MAX_RADIUS;
        y = Math.random() * HEIGHT;
        break;
    }
    const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    const angle = Math.random() * Math.PI * 2;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    const radius = ASTEROID_MIN_RADIUS + Math.random() * (ASTEROID_MAX_RADIUS - ASTEROID_MIN_RADIUS);
    // add rotation properties for visual flair
    const rot = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // slow spin
    asteroids.push({ x, y, vx, vy, radius, rot, rotSpeed });
  }

  // --- Input handling ---
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowUp') playTone(600, 0.05);
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function update(dt) {
    // ship rotation
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed * dt;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed * dt;
    // thrust
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust * dt;
      ship.vy += Math.sin(ship.angle) * ship.thrust * dt;
    }
    // move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // screen wrap
    if (ship.x < 0) ship.x += WIDTH;
    if (ship.x > WIDTH) ship.x -= WIDTH;
    if (ship.y < 0) ship.y += HEIGHT;
    if (ship.y > HEIGHT) ship.y -= HEIGHT;

    // update asteroids (position + rotation)
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.rotSpeed * dt;
      // wrap
      if (a.x < -a.radius) a.x += WIDTH + a.radius * 2;
      if (a.x > WIDTH + a.radius) a.x -= WIDTH + a.radius * 2;
      if (a.y < -a.radius) a.y += HEIGHT + a.radius * 2;
      if (a.y > HEIGHT + a.radius) a.y -= HEIGHT + a.radius * 2;
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    // green gradient for a glowing ship
    const grad = ctx.createLinearGradient(-8, -7, 12, 0);
    grad.addColorStop(0, '#6f6');
    grad.addColorStop(1, '#0a0');
    ctx.fillStyle = grad;
    ctx.fill();
    // subtle stroke outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      // gray gradient for depth
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#666');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) return true;
    }
    return false;
  }

  let lastTime = performance.now();
  let elapsed = 0;
  let gameOver = false;
  let score = 0;

  function loop(now) {
    const dt = (now - lastTime) / 16.666; // normalize to ~60fps units
    lastTime = now;
    if (!gameOver) {
      update(dt);
      if (checkCollision()) gameOver = true;
      elapsed += now - lastTime;
      score = Math.floor(elapsed / 1000);
    }
    // draw
    ctx.fillStyle = '#000'; // space black background
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawStars();
    drawShip();
    drawAsteroids();
    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 120, HEIGHT / 2);
    }
    requestAnimationFrame(loop);
  }

  // start spawning and loop
  setInterval(spawnAsteroid, SPAWN_INTERVAL);
  requestAnimationFrame(loop);
})();
