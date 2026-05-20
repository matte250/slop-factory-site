// Space Drift – minimal HTML‑canvas game
// Canvas must exist with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // ---- game state -------------------------------------------------
  const ship = { x: 80, y: H / 2, r: 15, speed: 4, shield: 0 };
  let asteroids = [];
  let fuels = [];
  let score = 0;
  let gameOver = false;
  // starfield background
  const stars = Array.from({ length: 100 }, () => ({
    x: rand(0, W),
    y: rand(0, H),
    size: rand(1, 3)
  }));

  // ---- utility ----------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---- input ------------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---- spawn helpers ----------------------------------------------
  const spawnAsteroid = () => {
    const size = rand(15, 40);
    asteroids.push({ x: W + size, y: rand(0, H), r: size, speed: rand(2, 5) });
  };
  const spawnFuel = () => {
    const r = 10;
    fuels.push({ x: W + r, y: rand(0, H), r, speed: 2.5, collected: false });
  };

  // ---- main loop -------------------------------------------------
  const update = () => {
    if (gameOver) return;
    // ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W, ship.x));
    ship.y = Math.max(0, Math.min(H, ship.y));

    // spawn obstacles
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // move asteroids
    asteroids.forEach(a => (a.x -= a.speed));
    asteroids = asteroids.filter(a => a.x + a.r > 0);

    // move fuels
    fuels.forEach(f => (f.x -= f.speed));
    fuels = fuels.filter(f => f.x + f.r > 0 && !f.collected);

    // shield timer
    if (ship.shield > 0) ship.shield -= 1;

    // collision detection
    for (const a of asteroids) {
      if (dist(ship, a) < ship.r + a.r) {
        if (ship.shield > 0) {
          // destroy asteroid, lose shield
          ship.shield = 0;
          asteroids = asteroids.filter(x => x !== a);
          // shield hit sound
          playTone(440, 0.08);
        } else {
          gameOver = true;
          // crash sound
          playTone(180, 0.3);
        }
        break;
      }
    }
    for (const f of fuels) {
      if (!f.collected && dist(ship, f) < ship.r + f.r) {
        f.collected = true;
        score += 10;
        ship.shield = 180; // ~3 seconds of shield
        // fuel collection sound
        playTone(660, 0.12);
      }
    }
  };

  const draw = () => {
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#000014');
    bg.addColorStop(1, '#000030');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
      // slight twinkle
      s.x -= 0.5;
      if (s.x < 0) { s.x = W; s.y = rand(0, H); }
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.fillStyle = ship.shield > 0 ? 'rgba(0,255,255,0.5)' : '#00ffcc';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r, ship.r);
    ctx.lineTo(-ship.r, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // fuels
    ctx.fillStyle = 'orange';
    for (const f of fuels) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (ship.shield > 0) {
      ctx.fillText('Shield', 10, 40);
    }
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // start
  requestAnimationFrame(loop);
})();
