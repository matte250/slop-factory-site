// Minimal Asteroid Drift game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.offsetWidth || 800);
  const h = (canvas.height = canvas.offsetHeight || 600);

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  function playThrustStart() {
    if (ship.thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    ship.thrustOsc = { osc, gain };
  }

  function stopThrust() {
    if (ship.thrustOsc) {
      const { osc, gain } = ship.thrustOsc;
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.2);
      ship.thrustOsc = null;
    }
  }

  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.stop(audioCtx.currentTime + 0.6);
  }

  // Ship definition
  const ship = {
    x: w / 2,
    y: h / 2,
    r: 8,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.05,
    turnSpeed: 0.07,
    thrusting: false,
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  const asteroids = [];
  const stars = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  // generate star field
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    // spawn at random edge with random rotation
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 0.5 + Math.random() * 1.0;
    const radius = 15 + Math.random() * 15;
    const angle = Math.random() * Math.PI * 2; // initial rotation
    const rotSpeed = (Math.random() - 0.5) * 0.01; // slow spin
    switch (side) {
      case 0: // top
        x = Math.random() * w;
        y = -radius;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // right
        x = w + radius;
        y = Math.random() * h;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // bottom
        x = Math.random() * w;
        y = h + radius;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      case 3: // left
        x = -radius;
        y = Math.random() * h;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    asteroids.push({x, y, vx, vy, r: radius, angle, rotSpeed});
  }

  function update(dt) {
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed * dt;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed * dt;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust * dt;
      ship.vy += Math.sin(ship.angle) * ship.thrust * dt;
      ship.thrusting = true;
      playThrustStart();
    } else {
      ship.thrusting = false;
      stopThrust();
    }
    // apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // simple damping
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.rotSpeed) a.angle += a.rotSpeed * dt;
    }
    // collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        gameOver = true;
        playExplosion();
        break;
      }
    }
    // off‑screen ship ends game
    if (ship.x < -ship.r || ship.x > w + ship.r || ship.y < -ship.r || ship.y > h + ship.r) {
      if (!gameOver) {
        gameOver = true;
        playExplosion();
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Star field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with optional thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (ship.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 6, ship.r / 3);
      ctx.lineTo(-ship.r - 6, -ship.r / 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Asteroids with rotation and shading
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle || 0);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.3, 0, 0, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const seconds = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillText('Score: ' + seconds, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 16; // normalize to ~60fps units
    if (!gameOver) update(dt);
    draw();
    lastTime = now;
    requestAnimationFrame(loop);
  }
  loop();
})();
