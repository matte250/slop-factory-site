// Simple Asteroid Dodge game with enhanced visuals
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Starfield background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

    // Thrust particles
  const particles = []; // each {x,y,vx,vy,radius,alpha,life}

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Ensure audio context resumes on first interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  // Game state
  let running = true;
  let score = 0;

  // Ship definition
  const ship = {
    x: WIDTH * 0.1,
    y: HEIGHT / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 12,
    fuel: 100,
    thrustPower: 0.07,
    rotateSpeed: 0.05,
  };

  // Asteroids and fuel pods
  const asteroids = [];
  const fuelPods = [];
  const ASTEROID_INTERVAL = 1500; // ms
  const FUEL_INTERVAL = 8000;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // Utility
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Ship controls
  function updateShip(dt) {
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    const thrusting = keys['ArrowUp'] && ship.fuel > 0;
    if (thrusting) {
      ship.vx += Math.cos(ship.angle) * ship.thrustPower;
      ship.vy += Math.sin(ship.angle) * ship.thrustPower;
      ship.fuel -= dt * 0.02; // fuel consumption
      // emit thrust particles
      for (let i = 0; i < 2; i++) {
        const angle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.3;
        particles.push({
          x: ship.x - Math.cos(ship.angle) * 15,
          y: ship.y - Math.sin(ship.angle) * 15,
          vx: Math.cos(angle) * (0.02 + Math.random() * 0.02),
          vy: Math.sin(angle) * (0.02 + Math.random() * 0.02),
          radius: Math.random() * 2 + 1,
          alpha: 0.8,
          life: 500, // ms
        });
      }
      // play thrust sound
      playTone(440, 80);
    }
    // apply drag
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // keep inside canvas
    if (ship.x < 0) ship.x = 0;
    if (ship.x > WIDTH) ship.x = WIDTH;
    if (ship.y < 0) ship.y = 0;
    if (ship.y > HEIGHT) ship.y = HEIGHT;
  }

  // Asteroid handling
  function spawnAsteroid() {
    const size = rand(15, 40);
    asteroids.push({
      x: WIDTH + size,
      y: rand(size, HEIGHT - size),
      vx: -rand(0.05, 0.2),
      radius: size,
      angle: rand(0, Math.PI * 2),
      angularVel: rand(-0.001, 0.001),
    });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.angle += a.angularVel * dt;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
  }

  // Fuel pod handling
  function spawnFuel() {
    const size = 8;
    fuelPods.push({
      x: WIDTH + size,
      y: rand(size, HEIGHT - size),
      vx: -0.08,
      radius: size,
    });
  }

  function updateFuel(dt) {
    for (let i = fuelPods.length - 1; i >= 0; i--) {
      const f = fuelPods[i];
      f.x += f.vx * dt;
      if (f.x + f.radius < 0) fuelPods.splice(i, 1);
    }
  }

  // Update thrust particles
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      // fade out
      p.alpha = Math.max(0, p.life / 500);
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // Collision detection
  function checkCollisions() {
    // ship vs asteroids
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius) {
        running = false;
        // collision sound
        playTone(150, 300);
        return;
      }
    }
    // ship vs fuel pods
    for (let i = fuelPods.length - 1; i >= 0; i--) {
      const f = fuelPods[i];
      if (dist(ship, f) < ship.radius + f.radius) {
        ship.fuel = Math.min(ship.fuel + 30, 100);
        fuelPods.splice(i, 1);
        // fuel collect sound
        playTone(660, 120);
      }
    }
  }

  // Rendering
  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // stars
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    }

    // particles (thrust)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
      ctx.fill();
    }

    // ship with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#050');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids with rotation
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // fuel pods
    ctx.fillStyle = '#ff0';
    for (const f of fuelPods) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}` , 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH/2, HEIGHT/2);
    }
  }

  // Main loop
  let lastTime = performance.now();
  let asteroidTimer = 0;
  let fuelTimer = 0;

  function loop(now) {
    const dt = now - lastTime; // ms
    lastTime = now;
    if (!running) { draw(); return; }

    // timers
    asteroidTimer += dt;
    fuelTimer += dt;
    if (asteroidTimer > ASTEROID_INTERVAL) { spawnAsteroid(); asteroidTimer = 0; }
    if (fuelTimer > FUEL_INTERVAL) { spawnFuel(); fuelTimer = 0; }

    // updates
    updateShip(dt);
    updateAsteroids(dt);
    updateFuel(dt);
    updateParticles(dt);
    checkCollisions();
    score += dt * 0.01; // increase over time

    // render
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
