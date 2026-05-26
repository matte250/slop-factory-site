// game.js – minimal Solar Flare Escape implementation
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- Visual enhancers ---------------------------------------------------
  // Starfield background
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * 0.5 + 0.5,
    });
  }

  // ----- Game objects -------------------------------------------------------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    r: 12,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    thrust: 0.15,
    rotateSpeed: 0.07,
    shield: false,
    shieldTime: 0,
  };

  const asteroids = [];
  const flares = [];
  const cells = [];

  // ----- Helpers -----------------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- Init --------------------------------------------------------------
  for (let i = 0; i < 12; i++) {
    asteroids.push({
      x: rand(30, canvas.width - 30),
      y: rand(30, canvas.height - 30),
      r: rand(15, 30),
    });
  }

  // Spawn an energy cell every 5‑10 seconds
  const spawnCell = () => {
    cells.push({
      x: rand(30, canvas.width - 30),
      y: rand(30, canvas.height - 30),
      r: 8,
    });
    setTimeout(spawnCell, rand(5000, 10000));
  };
  spawnCell();

  // ----- Input --------------------------------------------------------------
  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  let bgOsc = null;
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.11);
    }, dur);
  };

  const startBackground = () => {
    if (bgOsc) return;
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 30;
    bgOsc.type = 'sine';
    bgOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    bgOsc.start();
  };

  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startBackground();
    keys[e.code] = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      ship.thrusting = true;
      // start thrust sound if not already
      if (!thrustOsc) {
        thrustOsc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        thrustOsc.frequency.value = 150;
        thrustOsc.type = 'square';
        thrustOsc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        thrustOsc.start();
      }
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      ship.thrusting = false;
      if (thrustOsc) {
        thrustOsc.stop();
        thrustOsc.disconnect();
        thrustOsc = null;
      }
    }
  });

  // ----- Game loop ----------------------------------------------------------
  const update = dt => {
    // reset thrust flag each frame
    ship.thrusting = false;
    // Update stars twinkle
    for (const s of stars) {
      s.twinkle += (Math.random() - 0.5) * 0.02;
      if (s.twinkle < 0.3) s.twinkle = 0.3;
      if (s.twinkle > 1) s.twinkle = 1;
    }
    // Ship rotation
    if (keys.ArrowLeft || keys.KeyA) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight || keys.KeyD) ship.angle += ship.rotateSpeed;
    // Thrust
    if (keys.ArrowUp || keys.KeyW) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Apply velocity & wrap around screen
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= 0.99; // friction
    ship.vy *= 0.99;
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Shield timer
    if (ship.shield) {
      ship.shieldTime -= dt;
      if (ship.shieldTime <= 0) ship.shield = false;
    }

    // Solar flares – spawn every 3‑4 seconds, expand then disappear
    if (Math.random() < dt / 3000) {
      flares.push({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        r: 0,
        maxR: rand(80, 150),
        growth: 0.2,
        life: 2000, // ms
      });
    }
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i];
      f.r = Math.min(f.r + f.growth * dt, f.maxR);
      f.life -= dt;
      if (f.life <= 0) flares.splice(i, 1);
      // Collision with ship
      if (dist(ship, f) < f.r && !ship.shield) {
        // Game over – reset ship position
        ship.x = canvas.width / 2;
        ship.y = canvas.height - 60;
        ship.vx = ship.vy = 0;
        ship.angle = -Math.PI / 2;
        ship.shield = false;
      }
    }

    // Asteroid collision – ends game unless shielded
    for (const a of asteroids) {
      if (dist(ship, a) < ship.r + a.r) {
        if (ship.shield) continue;
        ship.x = canvas.width / 2;
        ship.y = canvas.height - 60;
        ship.vx = ship.vy = 0;
        ship.angle = -Math.PI / 2;
        break;
      }
    }

    // Energy cell collection – grant shield for 5 s
    for (let i = cells.length - 1; i >= 0; i--) {
      const c = cells[i];
      if (dist(ship, c) < ship.r + c.r) {
        ship.shield = true;
        ship.shieldTime = 5000;
        // shield pickup sound
        playTone(600, 100);
        cells.splice(i, 1);
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Starfield
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.twinkle})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Flares
    for (const f of flares) {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,180,0,0.6)');
      grad.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Energy cells
    ctx.fillStyle = '#0f0';
    for (const c of cells) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // thrust flame
    if (ship.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 8, -4);
      ctx.lineTo(-ship.r - 8, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = ship.shield ? '#0ff' : '#fff';
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  let last = performance.now();
  const loop = now => {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
