// Simple Asteroid Escape game
// Canvas must have id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  // Ship
  const ship = {x: W/2, y: H/2, r: 10, vx: 0, vy: 0, speed: 0.2, fuel: 100};
  const keys = {};

  // Entities
  const asteroids = [];
  const fuels = [];
  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // Sound effects
  const thrustSound = new Audio('https://actions.google.com/sounds/v1/cartoon/slide_1.wav');
  const explosionSound = new Audio('https://actions.google.com/sounds/v1/explosions/explosion_01.wav');
  const fuelSound = new Audio('https://actions.google.com/sounds/v1/foley/metal_clank_001.wav');
  let thrustPlaying = false;
  // Starfield init
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: rand(0, W),
      y: rand(0, H),
      alpha: 0.5 + Math.random() * 0.5,
    });
  }

  // Input
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4));
    const obj = {r: rand(8, 20)};
    switch (side) {
      case 0: obj.x = 0; obj.y = rand(0, H); break; // left
      case 1: obj.x = W; obj.y = rand(0, H); break; // right
      case 2: obj.x = rand(0, W); obj.y = 0; break; // top
      case 3: obj.x = rand(0, W); obj.y = H; break; // bottom
    }
    const angle = Math.atan2(ship.y - obj.y, ship.x - obj.x);
    const speed = rand(0.5, 1.5);
    obj.vx = Math.cos(angle) * speed;
    obj.vy = Math.sin(angle) * speed;
    asteroids.push(obj);
  }

  function spawnFuel() {
    const obj = {
      x: rand(20, W-20),
      y: rand(20, H-20),
      r: 6,
    };
    fuels.push(obj);
  }

  function update(dt) {
    if (gameOver) return;
    // Ship controls
    const thrusting = keys['ArrowUp']||keys['ArrowDown']||keys['ArrowLeft']||keys['ArrowRight'];
    if (keys['ArrowUp']) { ship.vy -= ship.speed; ship.fuel -= 0.02; }
    if (keys['ArrowDown']) { ship.vy += ship.speed; ship.fuel -= 0.02; }
    if (keys['ArrowLeft']) { ship.vx -= ship.speed; ship.fuel -= 0.02; }
    if (keys['ArrowRight']) { ship.vx += ship.speed; ship.fuel -= 0.02; }
    // Thrust sound management
    if (thrusting) {
      if (!thrustPlaying) { thrustSound.loop = true; thrustSound.play(); thrustPlaying = true; }
    } else {
      if (thrustPlaying) { thrustSound.pause(); thrustSound.currentTime = 0; thrustPlaying = false; }
    }
    // Apply friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx * dt; ship.y += ship.vy * dt;
    // Keep inside bounds
    if (ship.x < 0) ship.x = 0; if (ship.x > W) ship.x = W;
    if (ship.y < 0) ship.y = 0; if (ship.y > H) ship.y = H;
    // Update asteroids
    for (let i = asteroids.length-1; i >=0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt; a.y += a.vy * dt;
      // collision with ship
      if (dist(a, ship) < a.r + ship.r) {
        if (!gameOver) explosionSound.play();
        gameOver = true;
      }
      // remove off‑screen
      if (a.x < -50 || a.x > W+50 || a.y < -50 || a.y > H+50) asteroids.splice(i,1);
    }
    // Fuel pickups
    for (let i = fuels.length-1; i >=0; i--) {
      const f = fuels[i];
      if (dist(f, ship) < f.r + ship.r) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        fuelSound.play();
        fuels.splice(i,1);
      }
    }
    // Spawn logic
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();
    // Score & end conditions
    score += dt/1000;
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // Background starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Ship (triangle oriented to movement)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const angle = Math.atan2(ship.vy, ship.vx) || 0;
    ctx.rotate(angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids (simple polygon shapes)
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle || 0);
      ctx.beginPath();
      const sides = 6 + Math.floor(Math.random() * 4);
      const step = (Math.PI * 2) / sides;
      for (let i = 0; i < sides; i++) {
        const rad = a.r * (0.7 + Math.random() * 0.3);
        ctx.lineTo(Math.cos(i * step) * rad, Math.sin(i * step) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Fuel pickups (glowing radial gradient)
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
