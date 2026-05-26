// Minimal Orbit Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Load sound effects (replace URLs with actual files as needed)
  const sounds = {
    thrust: new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/laser.mp3'),
    explode: new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/boom.mp3'),
    gameover: new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/failure.mp3'),
    bgm: new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/loop.ogg')
  };
  sounds.bgm.loop = true;
  sounds.bgm.volume = 0.3;
  sounds.bgm.play().catch(() => {}); // autoplay may be blocked
  let soundPlayed = false;
  // Set canvas size to fill parent or fixed
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
    // Generate simple starfield
    const stars = Array.from({length: 100}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    }));

  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  const planetRadius = 30;

  // Ship state
  const ship = {
    angle: 0, // radians, 0 points to the right
    orbitRadius: planetRadius + 20,
    radialVel: 0,
    angularVel: 0,
    fuel: 100,
    size: 10,
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;

  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    // Random angle around planet, distance slightly outside ship orbit
    const angle = Math.random() * Math.PI * 2;
    const distance = ship.orbitRadius + 100 + Math.random() * 100;
    const speed = 0.5 + Math.random() * 1.0;
    asteroids.push({ angle, distance, speed, radius: 8 + Math.random() * 8 });
  }

  let thrusting = false;
  let exploded = false;
  function update(dt) {
    if (gameOver) return;
    // Controls
    if (keys['ArrowLeft']) ship.angularVel = -0.003;
    else if (keys['ArrowRight']) ship.angularVel = 0.003;
    else ship.angularVel = 0;

    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.radialVel -= 0.05; // thrust outward (negative because orbitRadius grows)
      ship.fuel -= dt * 0.02; // fuel consumption
      thrusting = true;
      if (sounds.thrust.paused) {
        sounds.thrust.currentTime = 0;
        sounds.thrust.play();
      }
    } else {
      thrusting = false;
      if (!sounds.thrust.paused) {
        sounds.thrust.pause();
        sounds.thrust.currentTime = 0;
      }
    }

    // Apply velocities
    ship.angle += ship.angularVel * dt;
    ship.orbitRadius += ship.radialVel * dt;
    // natural inward pull (gravity)
    ship.radialVel += 0.02 * dt; // pull toward planet

    // Clamp orbit radius to avoid penetrating planet
    if (ship.orbitRadius < planetRadius + ship.size) {
      ship.orbitRadius = planetRadius + ship.size;
      ship.radialVel = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.distance -= a.speed * dt; // move inward
      if (a.distance < planetRadius) {
        // remove asteroid that passed planet
        asteroids.splice(i, 1);
        continue;
      }
      // Collision detection
      const dx = Math.cos(a.angle) * a.distance - Math.cos(ship.angle) * ship.orbitRadius;
      const dy = Math.sin(a.angle) * a.distance - Math.sin(ship.angle) * ship.orbitRadius;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.size) {
        gameOver = true;
        exploded = true;
        sounds.explode.play();
        if (!soundPlayed) {
          sounds.gameover.play();
          sounds.bgm.pause();
          soundPlayed = true;
        }
      }
    }

    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update score (survival time)
    score += dt / 1000;
    // Fuel out condition
    if (ship.fuel <= 0 && ship.radialVel >= 0) {
      gameOver = true;
    }
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield
    ctx.fillStyle = 'rgba(255,255,255,1)';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Planet with gradient
    const planetGrad = ctx.createRadialGradient(
      center.x, center.y, planetRadius * 0.3,
      center.x, center.y, planetRadius
    );
    planetGrad.addColorStop(0, '#4a69bd');
    planetGrad.addColorStop(1, '#1b263b');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planetRadius, 0, Math.PI * 2);
    ctx.fill();
    // Ship (triangle)
    const shipX = center.x + Math.cos(ship.angle) * ship.orbitRadius;
    const shipY = center.y + Math.sin(ship.angle) * ship.orbitRadius;
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(ship.angle);
    // Ship with gradient
    const shipGrad = ctx.createRadialGradient(
      0, 0, ship.size * 0.2,
      0, 0, ship.size
    );
    shipGrad.addColorStop(0, '#ff6b6b');
    shipGrad.addColorStop(1, '#c0392b');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size, ship.size / 2);
    ctx.lineTo(-ship.size, -ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with gradient
    asteroids.forEach(a => {
      const x = center.x + Math.cos(a.angle) * a.distance;
      const y = center.y + Math.sin(a.angle) * a.distance;
      const grad = ctx.createRadialGradient(x, y, a.radius * 0.2, x, y, a.radius);
      grad.addColorStop(0, '#bdc3c7');
      grad.addColorStop(1, '#7f8c8d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.fillText('Fuel: ' + Math.max(0, ship.fuel.toFixed(1)), 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
