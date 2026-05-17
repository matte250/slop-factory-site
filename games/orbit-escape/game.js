// Game based on IDEA.md – simple orbit escape
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ==== Settings ====
  const planet = { x: W / 2, y: H / 2, r: 40 };
  const ship = {
    r: 8,
    orbitR: 120,
    angle: 0,
    speed: 0.03,
    health: 100,
    maxHealth: 100,
    score: 0,
  };
  const meteorPool = [];
  const starPool = [];
  const maxMeteors = 8;
  const maxStars = 5;

  // ==== Input ====
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnMeteor() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.0;
    meteorPool.push({ angle, r: 5, radius: planet.r + 5, speed });
  }
  function spawnStar() {
    const angle = Math.random() * Math.PI * 2;
    const radius = planet.r + 5;
    starPool.push({ angle, r: 4, radius, collected: false });
  }

  // Spawn over time
  let meteorTimer = 0, starTimer = 0;

  // ==== Main Loop ====
  function update(dt) {
    // ship controls – left/right rotate, up/down change orbit radius
    if (keys.ArrowLeft) ship.angle -= ship.speed;
    if (keys.ArrowRight) ship.angle += ship.speed;
    if (keys.ArrowUp) ship.orbitR = Math.max(60, ship.orbitR - 0.5);
    if (keys.ArrowDown) ship.orbitR = Math.min(200, ship.orbitR + 0.5);

    // meteors move outward
    for (let i = meteorPool.length - 1; i >= 0; i--) {
      const m = meteorPool[i];
      m.radius += m.speed;
      m.angle += 0.01; // slight spiral
      // collision with ship
      const sx = planet.x + ship.orbitR * Math.cos(ship.angle);
      const sy = planet.y + ship.orbitR * Math.sin(ship.angle);
      const mx = planet.x + m.radius * Math.cos(m.angle);
      const my = planet.y + m.radius * Math.sin(m.angle);
      const dx = sx - mx, dy = sy - my;
      if (Math.hypot(dx, dy) < ship.r + m.r) {
        ship.health -= 20;
        meteorPool.splice(i, 1);
        continue;
      }
      // remove when out of bounds
      if (m.radius > Math.max(W, H)) meteorPool.splice(i, 1);
    }

    // stars move outward similarly
    for (let i = starPool.length - 1; i >= 0; i--) {
      const s = starPool[i];
      s.radius += 0.6;
      s.angle += 0.005;
      const sx = planet.x + ship.orbitR * Math.cos(ship.angle);
      const sy = planet.y + ship.orbitR * Math.sin(ship.angle);
      const fx = planet.x + s.radius * Math.cos(s.angle);
      const fy = planet.y + s.radius * Math.sin(s.angle);
      const dx = sx - fx, dy = sy - fy;
      if (!s.collected && Math.hypot(dx, dy) < ship.r + s.r) {
        ship.health = Math.min(ship.maxHealth, ship.health + 15);
        ship.score += 10;
        s.collected = true;
        starPool.splice(i, 1);
        continue;
      }
      if (s.radius > Math.max(W, H)) starPool.splice(i, 1);
    }

    // spawn timers
    if (meteorTimer <= 0 && meteorPool.length < maxMeteors) {
      spawnMeteor();
      meteorTimer = 1500; // ms
    }
    if (starTimer <= 0 && starPool.length < maxStars) {
      spawnStar();
      starTimer = 3000;
    }
    meteorTimer -= dt;
    starTimer -= dt;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // planet with radial gradient
    const planetGradient = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
    planetGradient.addColorStop(0, '#777');
    planetGradient.addColorStop(1, '#111');
    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();

    // ship
    const sx = planet.x + ship.orbitR * Math.cos(ship.angle);
    const sy = planet.y + ship.orbitR * Math.sin(ship.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(sx, sy, ship.r, 0, Math.PI * 2);
    ctx.fill();

    // meteors
    ctx.fillStyle = '#a33';
    meteorPool.forEach(m => {
      const x = planet.x + m.radius * Math.cos(m.angle);
      const y = planet.y + m.radius * Math.sin(m.angle);
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // stars
    ctx.fillStyle = '#ff0';
    starPool.forEach(s => {
      const x = planet.x + s.radius * Math.cos(s.angle);
      const y = planet.y + s.radius * Math.sin(s.angle);
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // health bar
    const barW = 150, barH = 12;
    ctx.fillStyle = '#222';
    ctx.fillRect(10, 10, barW, barH);
    ctx.fillStyle = '#0f0';
    const healthRatio = ship.health / ship.maxHealth;
    ctx.fillRect(10, 10, barW * healthRatio, barH);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, barW, barH);
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + ship.score, 10, 35);
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (ship.health > 0) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }
  requestAnimationFrame(loop);
})();
