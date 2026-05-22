// Simple endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ship
  const ship = {
    x: W / 2,
    y: H * 0.8,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    radius: 12,
    fuel: 100,
    boostPower: 0.2,
    turnSpeed: 0.07,
    pulseRadius: 40,
  };

  // asteroids
  const asteroids = [];
  // star field
  const stars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.5,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
  }
  initStars();
  let spawnTimer = 0;
  let speed = 1.2; // scroll speed, increases over time
  let gameOver = false;

  // input handling
  const keys = {};
  // sound manager
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') playSound(400, 'triangle', 0.05);
    if (e.code === 'Space') playSound(800, 'square', 0.1);
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') playSound(200, 'sine', 0.03);
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const x = Math.random() * (W - 2 * radius) + radius;
    asteroids.push({ x, y: -radius, radius, vy: speed + Math.random() * 0.5 });
  }

  function update(dt) {
    if (gameOver) return;
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * ship.boostPower;
      ship.vy += Math.sin(ship.angle) * ship.boostPower;
      ship.fuel -= dt * 0.02;
    }
    // pulse
    if (keys['Space']) {
      // clear nearby asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        const dx = a.x - ship.x;
        const dy = a.y - ship.y;
        if (dx * dx + dy * dy < ship.pulseRadius * ship.pulseRadius) {
          asteroids.splice(i, 1);
        }
      }
      keys['Space'] = false; // one‑time pulse
    }
    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // keep ship within bounds
    ship.x = Math.max(ship.radius, Math.min(W - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(H - ship.radius, ship.y));

    // spawn asteroids
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = 1000 / (speed * 2); // ms
    }
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      // remove off‑screen
      if (a.y - a.radius > H) asteroids.splice(i, 1);
    }
    // collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.radius + ship.radius) ** 2) {
        gameOver = true;
        // play collision sound
        playSound(150, 'sawtooth', 0.4);
        break;
      }
    }
    // increase difficulty
    speed += dt * 0.00005;
    // apply speed to existing asteroids
    for (const a of asteroids) a.vy = speed + Math.random() * 0.5;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#090e1b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // star field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // ship with glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // fuel bar background
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 100, 8);
    // fuel level
    ctx.fillStyle = '#ff0';
    ctx.fillRect(10, 10, ship.fuel, 8);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
