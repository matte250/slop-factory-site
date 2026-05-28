// Simple Orbit Escape game targeting <canvas id="game"></canvas>
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 300;
    thrustOsc.type = 'square';
    thrustOsc.connect(gain);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Simple background hum
  function startBgMusic() {
    const notes = [220, 246, 261, 293];
    let i = 0;
    setInterval(() => {
      playTone(notes[i % notes.length], 0.2);
      i++;
    }, 800);
  }
  startBgMusic();
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  // Generate background stars
  const stars = [];
  const starCount = 150;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H });
  }
  const planet = { x: W / 2, y: H / 2, r: 30 };
  const ship = {
    x: planet.x,
    y: planet.y - planet.r - 10,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    r: 8,
    fuel: 100,
    thrusting: false,
  };

  const asteroids = [];
  const pods = [];
  const asteroidCount = 8;
  const podCount = 5;
  const gravity = 0.05; // pull toward planet
  const thrustPower = 0.2;
  const fuelDrain = 0.02; // per frame when idle
  const thrustDrain = 0.1; // per frame when thrusting
  let score = 0;
  let startTime = Date.now();
  let gameOver = false;

  // Initialize asteroids on fixed circular paths
  for (let i = 0; i < asteroidCount; i++) {
    const radius = 80 + i * 30;
    asteroids.push({ radius, angle: Math.random() * Math.PI * 2, speed: 0.01 + i * 0.002, r: 12 });
  }
  // Initialize fuel pods
  for (let i = 0; i < podCount; i++) {
    const radius = 100 + i * 40;
    pods.push({ radius, angle: Math.random() * Math.PI * 2, r: 6, collected: false });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    if (gameOver) return;

    // Update score based on time survived
    score = Math.floor((Date.now() - startTime) / 1000);

    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= 0.04;
    if (keys['ArrowRight']) ship.angle += 0.04;

    // Thrust
    const wasThrusting = ship.thrusting;
    ship.thrusting = keys['ArrowUp'];
    if (ship.thrusting && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * thrustPower;
      ship.vy += Math.sin(ship.angle) * thrustPower;
      ship.fuel = Math.max(0, ship.fuel - thrustDrain);
      if (!wasThrusting) startThrustSound();
    } else {
      ship.fuel = Math.max(0, ship.fuel - fuelDrain);
      if (wasThrusting) stopThrustSound();
    }

    // Gravity toward planet
    const dx = planet.x - ship.x;
    const dy = planet.y - ship.y;
    const dist = Math.hypot(dx, dy);
    const gravAcc = gravity * (dist / 200); // simple scaling
    ship.vx += (dx / dist) * gravAcc;
    ship.vy += (dy / dist) * gravAcc;

    // Update ship position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Keep ship within bounds (wrap)
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;

    // Update asteroids positions (orbit)
    for (const a of asteroids) {
      a.angle += a.speed;
    }

    // Update pods positions (orbit)
    for (const p of pods) {
      p.angle += 0.008;
    }

    // Collision detection
    for (const a of asteroids) {
      const ax = planet.x + Math.cos(a.angle) * a.radius;
      const ay = planet.y + Math.sin(a.angle) * a.radius;
      if (Math.hypot(ship.x - ax, ship.y - ay) < ship.r + a.r) {
        gameOver = true;
        playTone(100, 0.5); // crash sound
      }
    }

    for (const p of pods) {
      if (p.collected) continue;
      const px = planet.x + Math.cos(p.angle) * p.radius;
      const py = planet.y + Math.sin(p.angle) * p.radius;
      if (Math.hypot(ship.x - px, ship.y - py) < ship.r + p.r) {
        p.collected = true;
        ship.fuel = Math.min(100, ship.fuel + 30);
        score += 10; // bonus
      }
    }

    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background stars
    for (let s of stars) {
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x, planet.y, planet.r * 0.2,
      planet.x, planet.y, planet.r
    );
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();

    // Asteroids with gradient
    for (const a of asteroids) {
      const x = planet.x + Math.cos(a.angle) * a.radius;
      const y = planet.y + Math.sin(a.angle) * a.radius;
      const grad = ctx.createRadialGradient(x, y, a.r * 0.2, x, y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fuel pods with glowing gradient
    for (const p of pods) {
      if (p.collected) continue;
      const x = planet.x + Math.cos(p.angle) * p.radius;
      const y = planet.y + Math.sin(p.angle) * p.radius;
      const podGrad = ctx.createRadialGradient(x, y, p.r * 0.2, x, y, p.r);
      podGrad.addColorStop(0, '#8f8');
      podGrad.addColorStop(1, '#080');
      ctx.fillStyle = podGrad;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with thrust glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Draw thrust flame if thrusting
    if (ship.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 12, -6);
      ctx.lineTo(-ship.r - 12, 6);
      ctx.closePath();
      ctx.fill();
    }
    // Ship body gradient
    const shipGrad = ctx.createRadialGradient(0, 0, ship.r * 0.2, 0, 0, ship.r);
    shipGrad.addColorStop(0, ship.thrusting ? '#ffd700' : '#eee');
    shipGrad.addColorStop(1, ship.thrusting ? '#ff8c00' : '#aaa');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 30);
    }
  }

  function loop(timestamp) {
    const dt = 16; // fixed step approx 60fps
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
