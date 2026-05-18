// Nebula Escape – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const boostSound = () => playTone(440, 0.1);
  const collisionSound = () => playTone(100, 0.5);
  const fuelSound = () => playTone(660, 0.2);
  const gameOverSound = () => playTone(200, 1);

  // Set canvas size (full window)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game settings
  const SHIP_WIDTH = 40;
  const SHIP_HEIGHT = 20;
  const SHIP_SPEED = 4;
  const BOOST_SPEED = 8;
  const BOOST_FUEL_COST = 0.3;
  const FUEL_DEPLETION = 0.02; // per frame
  const ASTEROID_SIZE = 30;
  const ASTEROID_SPEED = 2;
  const FUELCELL_SIZE = 20;
  const FUELCELL_SPEED = 2;
  const STAR_SPEED = 0.5;
  const SPAWN_ASTEROID_EVERY = 90; // frames
  const SPAWN_FUELCELL_EVERY = 300; // frames
  const SPAWN_STAR_EVERY = 2; // frames

  // Game state
  const state = {
    ship: { x: canvas.width / 2 - SHIP_WIDTH / 2, y: canvas.height - SHIP_HEIGHT - 10, width: SHIP_WIDTH, height: SHIP_HEIGHT, fuel: 100, boosting: false },
    asteroids: [],
    fuelCells: [],
    stars: [], // background stars
    frame: 0,
    gameOver: false,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      boostSound();
      // Ensure audio context is running
      audioCtx.resume();
    }
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  const rectsIntersect = (a, b) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

  const spawnAsteroid = () => {
    const x = Math.random() * (canvas.width - ASTEROID_SIZE);
    state.asteroids.push({ x, y: -ASTEROID_SIZE, width: ASTEROID_SIZE, height: ASTEROID_SIZE });
  };

  const spawnFuelCell = () => {
    const x = Math.random() * (canvas.width - FUELCELL_SIZE);
    state.fuelCells.push({ x, y: -FUELCELL_SIZE, width: FUELCELL_SIZE, height: FUELCELL_SIZE });
  };
  const spawnStar = () => {
    const x = Math.random() * canvas.width;
    const size = Math.random() * 2 + 1; // small star
    state.stars.push({ x, y: -size, size });
  };

  const update = () => {
    if (state.gameOver) return;
    const s = state.ship;
    // Move ship
    if (keys['ArrowLeft']) s.x -= SHIP_SPEED;
    if (keys['ArrowRight']) s.x += SHIP_SPEED;
    // Keep within bounds
    s.x = Math.max(0, Math.min(canvas.width - s.width, s.x));
    // Boost
    s.boosting = keys['Space'];
    if (s.boosting && s.fuel > 0) {
      s.y -= BOOST_SPEED;
      s.fuel -= BOOST_FUEL_COST;
    } else {
      s.y -= SHIP_SPEED; // normal forward movement
    }
    // Fuel consumption
    s.fuel -= FUEL_DEPLETION;
    if (s.fuel <= 0) s.fuel = 0;

    // Scroll objects down relative to ship movement (keep ship near bottom)
    const scroll = Math.max(0, canvas.height - s.y - 100);
    if (scroll > 0) {
      s.y -= scroll;
      state.asteroids.forEach(a => (a.y += scroll));
      state.fuelCells.forEach(f => (f.y += scroll));
    }

    // Update asteroids
    state.asteroids.forEach(a => (a.y += ASTEROID_SPEED));
    state.asteroids = state.asteroids.filter(a => a.y < canvas.height);

    // Update fuel cells
    state.fuelCells.forEach(f => (f.y += FUELCELL_SPEED));
    state.fuelCells = state.fuelCells.filter(f => f.y < canvas.height);

    // Update stars
    state.stars.forEach(st => (st.y += STAR_SPEED));
    state.stars = state.stars.filter(st => st.y < canvas.height);

    // Collisions
    for (const a of state.asteroids) {
      if (rectsIntersect(s, a)) {
        collisionSound();
        state.gameOver = true;
        // Play game over sound after a short delay to let collision sound finish
        setTimeout(gameOverSound, 100);
        return;
      }
    }
    for (let i = state.fuelCells.length - 1; i >= 0; i--) {
      const f = state.fuelCells[i];
      if (rectsIntersect(s, f)) {
        s.fuel = Math.min(100, s.fuel + 30);
        state.fuelCells.splice(i, 1);
        fuelSound();
      }
    }

    // Spawn new objects
    if (state.frame % SPAWN_ASTEROID_EVERY === 0) spawnAsteroid();
    if (state.frame % SPAWN_FUELCELL_EVERY === 0) spawnFuelCell();
    if (state.frame % SPAWN_STAR_EVERY === 0) spawnStar();

    // Game over by fuel
    if (s.fuel <= 0) state.gameOver = true;

    state.frame++;
  };

  const draw = () => {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ship – draw as triangle for better look
    const s = state.ship;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.height);
    ctx.lineTo(s.x + s.width / 2, s.y);
    ctx.lineTo(s.x + s.width, s.y + s.height);
    ctx.closePath();
    ctx.fill();

    // Stars (background)
    ctx.fillStyle = '#222';
    for (const st of state.stars) {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Asteroids (draw as circles)
    ctx.fillStyle = '#888';
    for (const a of state.asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.width / 2, a.y + a.height / 2, a.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fuel cells (draw as diamonds)
    ctx.fillStyle = '#ff0';
    for (const f of state.fuelCells) {
      ctx.beginPath();
      ctx.moveTo(f.x, f.y + f.height / 2);
      ctx.lineTo(f.x + f.width / 2, f.y);
      ctx.lineTo(f.x + f.width, f.y + f.height / 2);
      ctx.lineTo(f.x + f.width / 2, f.y + f.height);
      ctx.closePath();
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(s.fuel)}`, 10, 20);

    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    if (!state.gameOver) update();
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
