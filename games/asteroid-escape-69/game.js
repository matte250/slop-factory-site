// Asteroid Escape game
// Canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // generate starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Unlock audio on first user interaction
  const unlockAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('click', unlockAudio, { once: true });
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // ==== Game state ====
  const ship = { x: width / 2, y: height - 60, w: 30, h: 30, speed: 4 };
  let fuel = 100; // percent
  const asteroids = [];
  const fuels = [];
  let lastAsteroid = 0;
  let lastFuel = 0;
  let gameOver = false;

  // ==== Input handling ====
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, dy: 2 + Math.random() * 3 });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, dy: 2 });
  }

  function update(dt) {
    if (gameOver) return;

    // move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // fuel consumption
    fuel -= dt * 0.02; // consume over time
    if (fuel <= 0) { gameOver = true; }

    // spawn asteroids every 1s
    if (Date.now() - lastAsteroid > 1000) { spawnAsteroid(); lastAsteroid = Date.now(); }
    // spawn fuel canister every 5s
    if (Date.now() - lastFuel > 5000) { spawnFuel(); lastFuel = Date.now(); }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.dy;
      if (a.y > height) asteroids.splice(i, 1);
      else if (rectCollide(ship, a)) { gameOver = true; playTone(120, 0.4); }
    }

    // update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.dy;
      if (f.y > height) fuels.splice(i, 1);
      else if (rectCollide(ship, f)) { fuel = Math.min(100, fuel + 30); fuels.splice(i, 1); }
    }
  }

  function rectCollide(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function draw() {
    // background starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // asteroids as circles with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2,
        a.x + a.w / 2, a.y + a.h / 2, a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // fuel canisters as small rectangles with gradient
    fuels.forEach(f => {
      const grad = ctx.createLinearGradient(f.x, f.y, f.x, f.y + f.h);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#cc0');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x, f.y, f.w, f.h);
    });

    // fuel bar
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 10, 104, 14);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(12, 12, fuel, 10);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
