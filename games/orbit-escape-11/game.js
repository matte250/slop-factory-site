// Simple Orbit Escape game implementation with improved graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // generate starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  // player orientation
  let shipAngle = 0;

  // ----- Game settings -----
  const PLAYER_SIZE = 15;
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playCollectSound = () => playTone(800, 0.1);
  const playCollisionSound = () => playTone(200, 0.3);
  const startBackground = () => {
    // simple low hum
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    // keep reference to stop later if needed
    window._bgOsc = osc;
  };
  // start background music on user interaction (required by browsers)
  window.addEventListener('click', function initAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startBackground();
    window.removeEventListener('click', initAudio);
  });
  const PLAYER_SPEED = 2.5;
  const FUEL_DECREASE = 0.02; // per frame
  const FUEL_GAIN = 30; // per cell
  const TARGET_FUEL = 200;
  const CELL_SIZE = 10;
  const ASTEROID_SIZE = 20;
  const SPAWN_CELL_EVERY = 2000; // ms
  const SPAWN_ASTEROID_EVERY = 3000; // ms

  // ----- State -----
  const player = { x: width / 2, y: height / 2, fuel: 100, vx: 0, vy: 0 };
  const cells = [];
  const asteroids = [];
  let keys = {};
  let gameOver = false;
  let win = false;

  // ----- Input -----
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  const collides = (obj, size, other, oSize) => distSq(obj, other) < (size + oSize) ** 2;

  // ----- Spawn -----
  setInterval(() => {
    cells.push({ x: rand(0, width), y: rand(0, height) });
  }, SPAWN_CELL_EVERY);

  setInterval(() => {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.5, 1.5);
    asteroids.push({
      x: rand(0, width),
      y: rand(0, height),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }, SPAWN_ASTEROID_EVERY);

  // ----- Game loop -----
  function update() {
    // Update ship orientation based on velocity
    if (player.vx !== 0 || player.vy !== 0) {
      shipAngle = Math.atan2(player.vy, player.vx);
    }
    if (gameOver) return;
    // movement
    player.vx = 0; player.vy = 0;
    if (keys['ArrowUp'] || keys['w']) player.vy = -PLAYER_SPEED;
    if (keys['ArrowDown'] || keys['s']) player.vy = PLAYER_SPEED;
    if (keys['ArrowLeft'] || keys['a']) player.vx = -PLAYER_SPEED;
    if (keys['ArrowRight'] || keys['d']) player.vx = PLAYER_SPEED;
    player.x = Math.max(0, Math.min(width, player.x + player.vx));
    player.y = Math.max(0, Math.min(height, player.y + player.vy));

    // fuel usage
    player.fuel -= FUEL_DECREASE;
    if (player.fuel <= 0) { player.fuel = 0; playCollisionSound(); gameOver = true; }

    // collect cells
    for (let i = cells.length - 1; i >= 0; i--) {
        if (collides(player, PLAYER_SIZE, cells[i], CELL_SIZE)) {
          player.fuel = Math.min(TARGET_FUEL, player.fuel + FUEL_GAIN);
          cells.splice(i, 1);
          playCollectSound();
          if (player.fuel >= TARGET_FUEL) { win = true; gameOver = true; }
        }
    }

    // move asteroids and check collision
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      // wrap around edges
      if (a.x < 0) a.x += width; else if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height; else if (a.y > height) a.y -= height;
    });
    for (const a of asteroids) {
      if (collides(player, PLAYER_SIZE, a, ASTEROID_SIZE)) { playCollisionSound(); gameOver = true; }
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player ship as triangle
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(shipAngle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(PLAYER_SIZE, 0);
    ctx.lineTo(-PLAYER_SIZE / 2, PLAYER_SIZE / 2);
    ctx.lineTo(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // fuel cells with glow
    cells.forEach(c => {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(c.x, c.y, CELL_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, ASTEROID_SIZE * 0.2, a.x, a.y, ASTEROID_SIZE);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, ASTEROID_SIZE, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(player.fuel)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = win ? '#0f0' : '#f00';
      ctx.font = '28px sans-serif';
      ctx.fillText(win ? 'You Win!' : 'Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
