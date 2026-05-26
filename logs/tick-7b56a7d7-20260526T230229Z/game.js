// Simple asteroid‑orbit canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const CENTER = { x: canvas.width / 2, y: canvas.height / 2 };
  const PLANET_R = 30;
  const SHIP_R = 8;
  const AST_R = 12;
  const FUEL_R = 6;

  // starfield background
  const STAR_COUNT = 80;
  const stars = Array.from({length: STAR_COUNT}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
  }));

  // sound effects (simple data‑URI wavs)
  const thrustAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short silent placeholder
  const fuelAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const explodeAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  let ship = {
    angle: 0,               // radians
    radius: PLANET_R + 40,   // distance from centre
    rotSpeed: 0,            // -1/0/1 per frame
    thrust: false,
    fuel: 100,
    alive: true,
  };

  const asteroids = [];
  const fuels = [];
  let frame = 0;
  let gameOver = false;

  // ---------- Input ----------
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ---------- Helpers ----------
  function polarToCart(angle, radius) {
    return {
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius,
    };
  }

  function distance(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  // ---------- Game logic ----------
  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(canvas.width, canvas.height) / 2 + 20;
    asteroids.push({ angle, radius, speed: 1 + Math.random() * 0.5 });
  }

  function spawnFuel() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(canvas.width, canvas.height) / 2 + 20;
    fuels.push({ angle, radius, speed: 0.8 });
  }

  function update() {
    if (!ship.alive) return;
    // input handling
    ship.rotSpeed = 0;
    if (keys['ArrowLeft']) ship.rotSpeed = -0.03;
    if (keys['ArrowRight']) ship.rotSpeed = 0.03;
    ship.thrust = keys['ArrowUp'] && ship.fuel > 0;

    // ship update
    ship.angle += ship.rotSpeed;
    if (ship.thrust) {
      ship.radius += 1; // thrust outward
      ship.fuel -= 0.2;
      // play thrust sound
      thrustAudio.currentTime = 0;
      thrustAudio.play();
    } else {
      // natural drift inward (gravity)
      ship.radius -= 0.3;
    }
    // keep ship within bounds
    ship.radius = Math.max(PLANET_R + SHIP_R, ship.radius);

    // asteroids update
    asteroids.forEach(a => a.radius -= a.speed);
    // fuels update
    fuels.forEach(f => f.radius -= f.speed);

    // collision detection
    const shipPos = polarToCart(ship.angle, ship.radius);
    asteroids.forEach((a, i) => {
      const pos = polarToCart(a.angle, a.radius);
      if (distance(shipPos, pos) < SHIP_R + AST_R) {
        ship.alive = false;
        gameOver = true;
        // play explosion sound
        explodeAudio.currentTime = 0;
        explodeAudio.play();
      }
      // remove asteroids that passed the planet
      if (a.radius < PLANET_R) asteroids.splice(i, 1);
    });
    fuels.forEach((f, i) => {
      const pos = polarToCart(f.angle, f.radius);
      if (distance(shipPos, pos) < SHIP_R + FUEL_R) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        fuels.splice(i, 1);
        // play fuel pickup sound
        fuelAudio.currentTime = 0;
        fuelAudio.play();
      }
      if (f.radius < PLANET_R) fuels.splice(i, 1);
    });

    // spawn timing
    if (frame % 120 === 0) spawnAsteroid(); // every 2 seconds @60fps
    if (frame % 500 === 0) spawnFuel();
    frame++;
  }

  // ---------- Rendering ----------
function draw() {
    // starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(CENTER.x, CENTER.y, PLANET_R * 0.2, CENTER.x, CENTER.y, PLANET_R);
    planetGrad.addColorStop(0, '#555');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, PLANET_R, 0, Math.PI * 2);
    ctx.fill();

    // ship as triangle, green if alive, red if dead
    const shipPos = polarToCart(ship.angle, ship.radius);
    const shipDir = ship.angle;
    ctx.fillStyle = ship.alive ? '#0f0' : '#f00';
    ctx.beginPath();
    ctx.moveTo(
      shipPos.x + Math.cos(shipDir) * SHIP_R,
      shipPos.y + Math.sin(shipDir) * SHIP_R
    );
    ctx.lineTo(
      shipPos.x + Math.cos(shipDir + Math.PI * 0.8) * SHIP_R * 0.6,
      shipPos.y + Math.sin(shipDir + Math.PI * 0.8) * SHIP_R * 0.6
    );
    ctx.lineTo(
      shipPos.x + Math.cos(shipDir - Math.PI * 0.8) * SHIP_R * 0.6,
      shipPos.y + Math.sin(shipDir - Math.PI * 0.8) * SHIP_R * 0.6
    );
    ctx.closePath();
    ctx.fill();

    // asteroids with simple gradient
    asteroids.forEach(a => {
      const p = polarToCart(a.angle, a.radius);
      const grad = ctx.createRadialGradient(p.x, p.y, AST_R * 0.2, p.x, p.y, AST_R);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, AST_R, 0, Math.PI * 2);
      ctx.fill();
    });

    // fuel pickups with glow gradient
    fuels.forEach(f => {
      const p = polarToCart(f.angle, f.radius);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, FUEL_R * 2);
      glow.addColorStop(0, 'rgba(255,255,0,0.8)');
      glow.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, FUEL_R * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
