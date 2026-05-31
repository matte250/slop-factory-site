// Minimal Asteroid Escape game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // generate static background stars
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      c: Math.random() < 0.5 ? '#fff' : '#aaa',
    });
  }

  // ----- Game objects -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    radius: 10,
    thrust: 0,
    vx: 0,
    vy: 0,
    fuel: 100,
  };

  const asteroids = [];
  const fuels = [];

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const spawnAsteroid = () => {
    const size = rand(15, 30);
    const side = Math.floor(rand(0, 4));
    let x, y, vx, vy;
    switch (side) {
      case 0: // top
        x = rand(0, width); y = -size; vx = rand(-1, 1); vy = rand(0.5, 2); break;
      case 1: // right
        x = width + size; y = rand(0, height); vx = rand(-2, -0.5); vy = rand(-1, 1); break;
      case 2: // bottom
        x = rand(0, width); y = height + size; vx = rand(-1, 1); vy = rand(-2, -0.5); break;
      case 3: // left
        x = -size; y = rand(0, height); vx = rand(0.5, 2); vy = rand(-1, 1); break;
    }
    asteroids.push({x, y, vx, vy, r: size});
  };

  const spawnFuel = () => {
    const x = rand(20, width - 20);
    const y = rand(20, height - 20);
    fuels.push({x, y, r: 6});
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrustStart = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 200;
    thrustOsc.type = 'sawtooth';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  };
  const playCollect = () => playTone(600);
  const playExplosion = () => playTone(80, 0.3);

  // ----- Game loop -----
  let lastTime = 0;
  function update(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // ship controls
    if (keys['ArrowLeft']) ship.angle -= 3 * dt;
    if (keys['ArrowRight']) ship.angle += 3 * dt;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.thrust = 100;
      ship.fuel -= 20 * dt; // consume fuel
      // start thrust sound if not already playing
      if (!thrustOsc) playThrustStart();
    } else {
      ship.thrust = 0;
      // stop thrust sound when not thrusting
      if (thrustOsc) stopThrust();
    }
    // apply thrust
    ship.vx += Math.cos(ship.angle) * ship.thrust * dt / 50;
    ship.vy += Math.sin(ship.angle) * ship.thrust * dt / 50;
    // friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx; ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // asteroids move
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.r || a.x > width + a.r || a.y < -a.r || a.y > height + a.r) {
        asteroids.splice(i, 1);
      }
    }

    // spawn logic
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // fuel collection
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = f.x - ship.x, dy = f.y - ship.y;
if (Math.hypot(dx, dy) < ship.radius + f.r) {
          ship.fuel = Math.min(ship.fuel + 30, 100);
          fuels.splice(i, 1);
          playCollect();
        }
    }

    // collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.radius) {
        // lose condition
        playExplosion();
        setTimeout(() => {
          alert('Game Over');
          document.location.reload();
        }, 200);
        return;
      }
    }
    if (ship.fuel <= 0) {
      playExplosion();
      setTimeout(() => {
        alert('Out of fuel – Game Over');
        document.location.reload();
      }, 200);
      return;
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // background: dark space with stars
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);
    // draw stars (generated once)
    stars.forEach(s => {
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // ship with optional thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'cyan';
    // ship hull
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    // thrust flame when accelerating
    if (ship.thrust > 0) {
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    ctx.shadowBlur = 0;
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cells with glow
    fuels.forEach(f => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'lime';
      ctx.fillStyle = 'lime';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // fuel bar
    ctx.fillStyle = 'orange';
    ctx.fillRect(10, 10, ship.fuel, 8);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(10, 10, 100, 8);
  }

  // start game
  requestAnimationFrame(update);
})();
