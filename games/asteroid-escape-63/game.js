// Asteroid Escape with enhanced graphics

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ----- Player -----
  const ship = {
    x: W / 2,
    y: H / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: 0.2,
    boost: 0.6,
    fuel: 100,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration);
  }
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 80;
    thrustOsc.type = 'sawtooth';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  document.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'ArrowUp') startThrustSound();
  });
  document.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
    if (e.key === 'ArrowUp') stopThrustSound();
  });
  document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- Entities -----
  const asteroids = [];
  const orbs = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastOrb = 0;
  // starfield
  const stars = [];
  function initStars() {
    for (let i = 0; i < 100; i++) {
      stars.push({ x: rand(0, W), y: rand(0, H), speed: rand(0.1, 0.5) });
    }
  }
  initStars();

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4)); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const radius = rand(10, 30);
    const speed = rand(0.5, 2);
    switch (side) {
      case 0: x = rand(0, W); y = -radius; vx = rand(-1, 1); vy = speed; break;
      case 1: x = W + radius; y = rand(0, H); vx = -speed; vy = rand(-1, 1); break;
      case 2: x = rand(0, W); y = H + radius; vx = rand(-1, 1); vy = -speed; break;
      case 3: x = -radius; y = rand(0, H); vx = speed; vy = rand(-1, 1); break;
    }
    asteroids.push({ x, y, r: radius, vx, vy });
  }

  function spawnOrb() {
    const x = rand(20, W - 20);
    const y = rand(20, H - 20);
    const r = 8;
    const vx = rand(-0.3, 0.3);
    const vy = rand(-0.3, 0.3);
    orbs.push({ x, y, r, vx, vy });
  }

  function update(dt) {
    // move stars for parallax effect
    stars.forEach(s => {
      s.x += s.speed;
      if (s.x > W) s.x = 0;
    });
    // ship controls
    if (keys.ArrowLeft) ship.angle -= 0.04;
    if (keys.ArrowRight) ship.angle += 0.04;
    const thrust = keys.ArrowUp ? ship.boost : ship.speed;
    if (keys.ArrowUp && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel -= 0.05;
    }
    // apply friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx; ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += W; if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H; if (ship.y > H) ship.y -= H;

    // spawn asteroids/orbs over time
    if (performance.now() - lastAsteroid > 1000) { spawnAsteroid(); lastAsteroid = performance.now(); }
    if (performance.now() - lastOrb > 3000) { spawnOrb(); lastOrb = performance.now(); }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // remove off‑screen
      if (a.x < -50 || a.x > W + 50 || a.y < -50 || a.y > H + 50) asteroids.splice(i, 1);
      // collision with ship
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.r) {
        // game over
        playTone(150, 300);
        alert(`Game over! Score: ${score}`);
        document.location.reload();
        return;
      }
    }

    // update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x += o.vx; o.y += o.vy;
      if (o.x < -20 || o.x > W + 20 || o.y < -20 || o.y > H + 20) orbs.splice(i, 1);
      const dx = o.x - ship.x, dy = o.y - ship.y;
      if (Math.hypot(dx, dy) < o.r + ship.r) {
        score += 10;
        ship.fuel = Math.min(100, ship.fuel + 20);
        orbs.splice(i, 1);
      }
    }
  }

  function draw() {
    // starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#444';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // ship thrust flame
    if (keys.ArrowUp && ship.fuel > 0) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 8, -4);
      ctx.lineTo(-ship.r - 8, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-ship.r, 0, ship.r, 0);
    shipGrad.addColorStop(0, '#0c0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // glowing orbs
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 40);
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
