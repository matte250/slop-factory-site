// Meteor Dodge Game – minimal implementation
(() => {
  // Load sound effects (small data URLs)
  const sounds = {
    thrust: (() => {
      const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAAAB3AgAEABAAZGF0YQgAAAAA');
      a.loop = true;
      return a;
    })(),
    crash: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAAAB3AgAEABAAZGF0YQgAAAAA'),
    pickup: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAAAB3AgAEABAAZGF0YQgAAAAA')
  };

  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;
  // Pre‑generate stars for background
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random(),
      delta: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? -1 : 1), // twinkle speed
    });
  }

  // Game state
  let ship = { x: 50, y: height / 2, w: 30, h: 15, dy: 0 };
  const exhaust = []; // ship exhaust particles
  const meteors = [];
  const fuels = [];
  let lastSpawn = 0;
  let lastFuel = 0;
  let elapsed = 0; // seconds survived
  let fuel = 10; // seconds of extra fuel
  let gameOver = false;
  let lastTime = performance.now();

  // Input handling (arrow up/down or W/S)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // Ship movement
    ship.dy = 0;
    if (keys.ArrowUp || keys.w) ship.dy = -200;
    if (keys.ArrowDown || keys.s) ship.dy = 200;
    ship.y += ship.dy * dt;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    // Thrust sound
    if (ship.dy !== 0) {
      if (sounds.thrust.paused) sounds.thrust.play();
    } else {
      if (!sounds.thrust.paused) {
        sounds.thrust.pause();
        sounds.thrust.currentTime = 0;
      }
    }
    // Emit exhaust particle
    exhaust.push({
      x: ship.x,
      y: ship.y + ship.h / 2,
      size: 3,
      alpha: 0.8,
      speed: 200,
    });

    // Spawn meteors every 0.8‑1.2 s
    if (performance.now() - lastSpawn > 800 + Math.random() * 400) {
      meteors.push({
        x: width,
        y: Math.random() * (height - 30),
        w: 30,
        h: 30,
        speed: 150 + Math.random() * 150,
      });
      lastSpawn = performance.now();
    }

    // Spawn fuel pickups occasionally (every 5‑8 s)
    if (performance.now() - lastFuel > 5000 + Math.random() * 3000) {
      fuels.push({
        x: width,
        y: Math.random() * (height - 20),
        w: 20,
        h: 20,
        speed: 100,
      });
      lastFuel = performance.now();
    }

    // Update meteors and exhaust particles
    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x -= m.speed * dt;
      if (m.x + m.w < 0) meteors.splice(i, 1);
    }
    // Update exhaust particles
    for (let i = exhaust.length - 1; i >= 0; i--) {
      const p = exhaust[i];
      p.x -= p.speed * dt;
      p.alpha -= dt;
      if (p.alpha <= 0) exhaust.splice(i, 1);
    }
    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed * dt;
      if (f.x + f.w < 0) fuels.splice(i, 1);
    }

    // Collision detection
    function rectCollide(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (rectCollide(ship, meteors[i])) {
        gameOver = true;
        sounds.crash.currentTime = 0;
        sounds.crash.play();
        break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (rectCollide(ship, fuels[i])) {
        fuel += 5; // add 5 s of fuel
        sounds.pickup.currentTime = 0;
        sounds.pickup.play();
        fuels.splice(i, 1);
      }
    }

    // Timer handling
    elapsed += dt;
    fuel -= dt;
    if (fuel <= 0) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // twinkling stars
    stars.forEach(s => {
      s.alpha += s.delta;
      if (s.alpha <= 0 || s.alpha >= 1) s.delta = -s.delta;
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship exhaust particles
    ctx.globalAlpha = 1;
    exhaust.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship – simple triangle with glow
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // meteors – circular with gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, 0, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
      grad.addColorStop(0, '#e44');
      grad.addColorStop(1, '#511');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuels – bright pickups
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${elapsed.toFixed(1)}s`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(1)}s`, 10, 40);
    if (gameOver) {
      // Stop thrust sound on game over
      if (!sounds.thrust.paused) {
        sounds.thrust.pause();
        sounds.thrust.currentTime = 0;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
