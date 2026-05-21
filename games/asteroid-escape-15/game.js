// game.js – minimal Asteroid Escape implementation
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ---- Audio setup ----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // resume on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(frequency, duration = 0.1, type = 'square', volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playThrust() { playTone(200, 0.07, 'sawtooth', 0.1); }
  function playFuel() { playTone(600, 0.1, 'triangle', 0.15); }
  function playExplosion() { playTone(100, 0.4, 'sine', 0.3); }

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === 'ArrowUp') playThrust(); });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---- Game objects ----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    fuel: 100,
  };

  const asteroids = [];
  const fuels = [];
  const stars = [];
  const particles = [];

  // ---- Starfield background ----
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    if (side === 0) {
      x = 0; y = Math.random() * canvas.height; vx = 1 + Math.random() * 2; vy = (Math.random() - 0.5) * 2;
    } else if (side === 1) {
      x = canvas.width; y = Math.random() * canvas.height; vx = -(1 + Math.random() * 2); vy = (Math.random() - 0.5) * 2;
    } else if (side === 2) {
      x = Math.random() * canvas.width; y = 0; vx = (Math.random() - 0.5) * 2; vy = 1 + Math.random() * 2;
    } else {
      x = Math.random() * canvas.width; y = canvas.height; vx = (Math.random() - 0.5) * 2; vy = -(1 + Math.random() * 2);
    }
    asteroids.push({ x, y, vx, vy, size });
  }

  function spawnFuel() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    fuels.push({ x, y, radius: 8 });
  }

  // particles for thrust
  function spawnParticle() {
    const speed = 0.5;
    particles.push({
      x: ship.x - Math.cos(ship.angle) * 12,
      y: ship.y - Math.sin(ship.angle) * 12,
      vx: -Math.cos(ship.angle) * speed + (Math.random() - 0.5) * 0.2,
      vy: -Math.sin(ship.angle) * speed + (Math.random() - 0.5) * 0.2,
      life: 30,
    });
  }

  setInterval(spawnAsteroid, 2000);
  setInterval(spawnFuel, 5000);

  function update(dt) {
    if (keys['ArrowLeft']) ship.angle -= 0.07;
    if (keys['ArrowRight']) ship.angle += 0.07;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel -= 0.05;
      spawnParticle(); // add flame particle
    }

    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.size || a.x > canvas.width + a.size || a.y < -a.size || a.y > canvas.height + a.size) {
        asteroids.splice(i, 1);
      }
    }

    // collect fuel
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = ship.x - f.x;
      const dy = ship.y - f.y;
      if (Math.hypot(dx, dy) < ship.radius + f.radius) {
        ship.fuel = Math.min(100, ship.fuel + 20);
        fuels.splice(i, 1);
        playFuel();
      }
    }

    // collision with asteroids
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      if (Math.hypot(dx, dy) < ship.radius + a.size) {
        playExplosion();
        endGame();
        break;
      }
    }

    // out of fuel
    if (ship.fuel <= 0) {
      playExplosion();
      endGame();
    }

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  let last = performance.now();
  let running = true;
  function loop(now) {
    if (!running) return;
    const dt = (now - last) / 16; // normalized step
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    // dark space background
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // starfield
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // thrust particles
    for (const p of particles) {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

    // asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // fuel cells
    ctx.fillStyle = 'lime';
    for (const f of fuels) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + Math.round(ship.fuel), 10, 20);
  }

  function endGame() {
    running = false;
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
  }

  requestAnimationFrame(loop);
})();
