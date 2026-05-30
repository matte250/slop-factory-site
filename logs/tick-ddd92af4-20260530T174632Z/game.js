// Minimal Asteroid Dash game
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Load sounds
  const sounds = {
    background: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-retro-2052.mp3'),
    thrust: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-2071.mp3'),
    explosion: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-whoosh-explosion-1171.mp3'),
  };
  sounds.background.loop = true;
  let audioStarted = false;
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Ship definition
  const ship = {
    x: W / 2,
    y: H / 2,
    r: 12,
    angle: 0,
    speed: 0,
    maxSpeed: 3,
    thrust: 0.1,
    fuel: 100,
    fuelDrain: 0.02,
  };

  const keys = {};
  addEventListener('keydown', e => (keys[e.key] = true));
  addEventListener('keyup', e => (keys[e.key] = false));
  // start audio on first interaction
  function startAudio() {
    if (!audioStarted) {
      audioStarted = true;
      sounds.background.volume = 0.3;
      sounds.background.play();
    }
  }
  addEventListener('keydown', startAudio);
  addEventListener('click', startAudio);

  // Asteroid pool
  const asteroids = [];
  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -radius : W + radius;
    const y = Math.random() * H;
    const speed = 1 + Math.random() * 2;
    const angle = side === 'left' ? 0 : Math.PI;
    asteroids.push({ x, y, radius, speed, angle });
  }
  let spawnTimer = 0;

  // Simple starfield background
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  }));

  function update() {
    // Controls
    if (keys['ArrowLeft']) ship.angle -= 0.05;
    if (keys['ArrowRight']) ship.angle += 0.05;
    if (keys['ArrowUp']) {
      ship.speed = Math.min(ship.maxSpeed, ship.speed + ship.thrust);
      ship.fuel = Math.max(0, ship.fuel - 0.1);
      // play thrust sound
      if (sounds.thrust.paused) {
        sounds.thrust.currentTime = 0;
        sounds.thrust.play();
      }
    } else {
      ship.speed *= 0.99; // drag
    }
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // wrap around
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;
    ship.fuel = Math.max(0, ship.fuel - ship.fuelDrain);

    // Asteroids
    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = 60 + Math.random() * 60; // approx 1‑2 sec
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += Math.cos(a.angle) * a.speed;
      a.y += Math.sin(a.angle) * a.speed;
      // remove off‑screen
      if (a.x < -a.radius || a.x > W + a.radius) asteroids.splice(i, 1);
    }

    // Collision detection (circle)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.r) {
        gameOver();
        return;
      }
    }
    if (ship.fuel <= 0) { gameOver(); return; }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // starfield with twinkling
    // draw dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#000011');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars (twinkling)
    for (const s of stars) {
      s.x += s.speed;
      if (s.x > W) s.x = 0;
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r * 0.6);
    ctx.lineTo(-ship.r, -ship.r * 0.6);
    ctx.closePath();
    ctx.fill();
    // ship outline
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // thrust flame when accelerating
    if (keys['ArrowUp']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 8, -4);
      ctx.lineTo(-ship.r - 8, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // asteroids with gradient and rotation
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.2,
        a.x, a.y, a.radius
      );
      grad.addColorStop(0, '#d9d9d9');
      grad.addColorStop(0.7, '#8b4513');
      grad.addColorStop(1, '#4b2e2e');
      ctx.fillStyle = grad;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.random() * Math.PI * 2);
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // fuel gauge
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 10, 104, 14);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(12, 12, ship.fuel, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, 104, 14);
  }

  let running = true;
  function gameOver() {
    running = false;
    // stop background music, play explosion
    sounds.background.pause();
    sounds.explosion.currentTime = 0;
    sounds.explosion.play();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
