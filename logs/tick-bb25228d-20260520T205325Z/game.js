// Simple "Orbit Escape" game targeting <canvas id="game"></canvas>
// Improved graphics: gradient ship, thrust flame, starfield background, gradient asteroids, glowing fuel cells.

(() => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(300, 0.1);
  const playCollision = () => playTone(80, 0.4);
  const playPickup = () => playTone(600, 0.15);

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match its displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // regenerate starfield based on size
    initStars();
  };
  resize();
  window.addEventListener('resize', resize);

  // ----- Starfield -------------------------------------------------------
  const stars = [];
  const starCount = () => Math.floor(canvas.width * canvas.height / 8000); // density
  const initStars = () => {
    stars.length = 0;
    for (let i = 0; i < starCount(); i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  };

  // ----- Game state -------------------------------------------------------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0, // radians, 0 points up
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotSpeed: 0.06,
    fuel: 100,
    maxFuel: 100,
  };

  const asteroids = [];
  const fuels = [];
  const maxAsteroids = 8;
  const maxFuels = 3;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const addAsteroid = () => {
    const radius = rand(15, 35);
    const y = rand(radius, canvas.height - radius);
    const speed = rand(0.5, 2);
    const angle = rand(0, Math.PI * 2);
    const rot = rand(-0.03, 0.03);
    asteroids.push({ x: -radius, y, radius, speed, angle, rot });
  };

  const addFuelCell = () => {
    const radius = 8;
    const x = rand(radius, canvas.width - radius);
    const y = rand(radius, canvas.height - radius);
    fuels.push({ x, y, radius, value: 30 });
  };

  // initialise objects
  for (let i = 0; i < maxAsteroids; i++) addAsteroid();
  for (let i = 0; i < maxFuels; i++) addFuelCell();

  // ----- Input handling ----------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helper functions -------------------------------------------------
  const wrap = (obj) => {
    if (obj.x < -obj.radius) obj.x = canvas.width + obj.radius;
    if (obj.x > canvas.width + obj.radius) obj.x = -obj.radius;
    if (obj.y < -obj.radius) obj.y = canvas.height + obj.radius;
    if (obj.y > canvas.height + obj.radius) obj.y = -obj.radius;
  };

  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ----- Game loop --------------------------------------------------------
  let gameOver = false;
  const loop = () => {
    if (gameOver) return;
    // update ship based on input
    if (keys['ArrowLeft']) ship.angle -= ship.rotSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotSpeed;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.vx += Math.sin(ship.angle) * ship.thrust;
      ship.vy -= Math.cos(ship.angle) * ship.thrust;
      ship.fuel -= 0.05; // fuel consumption per frame while thrusting
      playThrust();
    }
    // natural fuel drain
    ship.fuel = Math.max(0, ship.fuel - 0.01);
    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    wrap(ship);

    // update asteroids
    asteroids.forEach(a => {
      a.x += a.speed;
      a.angle += a.rot;
      wrap(a);
    });

    // check collisions with asteroids
    for (const a of asteroids) {
if (dist(ship.x, ship.y, a.x, a.y) < ship.radius + a.radius) {
          gameOver = true;
          playCollision();
          alert('Game Over – You hit an asteroid!');
          return;
        }
    }

    // check fuel collection
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
if (dist(ship.x, ship.y, f.x, f.y) < ship.radius + f.radius) {
          ship.fuel = Math.min(ship.maxFuel, ship.fuel + f.value);
          fuels.splice(i, 1);
          playPickup();
          // replenish fuel cell after a short delay
          setTimeout(addFuelCell, 2000);
        }
    }

    // lose condition – out of fuel
    if (ship.fuel <= 0) {
      gameOver = true;
      alert('Game Over – Out of fuel!');
      return;
    }

    // render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
      s.alpha += (Math.random() - 0.5) * 0.02;
      s.alpha = Math.min(1, Math.max(0.3, s.alpha));
    });
    // ship (gradient triangle) with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(0, ship.radius * 0.8);
      ctx.lineTo(-ship.radius * 0.4, ship.radius * 2);
      ctx.lineTo(ship.radius * 0.4, ship.radius * 2);
      ctx.closePath();
      const flameGrad = ctx.createLinearGradient(0, ship.radius * 0.8, 0, ship.radius * 2);
      flameGrad.addColorStop(0, 'orange');
      flameGrad.addColorStop(1, 'red');
      ctx.fillStyle = flameGrad;
      ctx.fill();
    }
    const shipGrad = ctx.createRadialGradient(0, 0, ship.radius * 0.2, 0, 0, ship.radius);
    shipGrad.addColorStop(0, '#00f9ff');
    shipGrad.addColorStop(1, '#001eff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.7, ship.radius);
    ctx.lineTo(-ship.radius * 0.7, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with gradient
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.3, 0, 0, a.radius);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      const spikes = 8;
      for (let i = 0; i < spikes; i++) {
        const theta = (i / spikes) * Math.PI * 2;
        const rad = i % 2 === 0 ? a.radius : a.radius * 0.6;
        ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // fuel cells with glow
    fuels.forEach(f => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'lime';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'lime';
      ctx.fill();
      ctx.restore();
    });
    // fuel gauge
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText('Fuel: ' + Math.round(ship.fuel), 10, 20);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
