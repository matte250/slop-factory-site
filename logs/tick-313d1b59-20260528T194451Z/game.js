// Asteroid Escape game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Ensure context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  document.addEventListener('keydown', resumeAudio, {once: true});

  function playTone(freq, type='sine', dur=0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }

  // Ship
  const ship = { x: W / 2, y: H - 40, w: 30, h: 30, speed: 4 };
  let fuel = 100; // percent
  let score = 0;
  const keys = {};
  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  // Entities
  const asteroids = [];
  const fuels = [];
  const stars = [];
  let lastAsteroid = 0, lastFuel = 0;
  let gameOver = false;

  // Initialize background stars
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5
      });
    }
  }
  initStars();

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 1 + Math.random() * 2 + score / 5000
    });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 1.5
    });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // Spawn asteroids every 1‑1.5s
    if (Date.now() - lastAsteroid > 1000 + Math.random() * 500) {
      spawnAsteroid();
      lastAsteroid = Date.now();
    }
    // Spawn fuel occasionally
    if (Date.now() - lastFuel > 5000 + Math.random() * 5000) {
      spawnFuel();
      lastFuel = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > H) asteroids.splice(i, 1);
    }
    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y > H) fuels.splice(i, 1);
    }
    // Update background stars (twinkling & drift)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.3; // slow drift
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      // twinkle
      s.alpha = Math.max(0.3, Math.min(1, s.alpha + (Math.random() - 0.5) * 0.05));
    }

    // Collisions
    function rectCollision(r1, r2) {
      return !(r2.x > r1.x + r1.w ||
               r2.x + r2.w < r1.x ||
               r2.y > r1.y + r1.h ||
               r2.y + r2.h < r1.y);
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (rectCollision(ship, asteroids[i])) {
        // Collision sound
        playTone(150, 'square', 0.3);
        gameOver = true;
        break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (rectCollision(ship, fuels[i])) {
        // Fuel collect sound
        playTone(600, 'triangle', 0.15);
        fuel = Math.min(100, fuel + 20);
        fuels.splice(i, 1);
      }
    }

    // Fuel consumption & score
    fuel -= dt * 0.01; // drains over time
    if (fuel <= 0) gameOver = true;
    score += dt;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Background stars
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // Ship
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids - draw as circles
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, Math.max(a.w, a.h)/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Fuel cells - draw as small stars
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      const cx = f.x + f.w/2;
      const cy = f.y + f.h/2;
      const r = Math.min(f.w, f.h)/2;
      // Move to first point
      let first = true;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI/2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
      }
      ctx.closePath();
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score / 1000)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

      ctx.closePath();
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score / 1000)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
