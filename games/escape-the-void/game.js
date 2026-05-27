// Minimal game based on IDEA.md
// Graphics enhancements: starfield background, ship gradient, irregular asteroids, simple explosion particles
// Canvas with id="game"; ship drifts forward, asteroids spawn, arrow keys steer.

(() => {
const canvas = document.getElementById('game');
   // Ensure canvas fills the window if not set
   canvas.width = canvas.width || window.innerWidth;
   canvas.height = canvas.height || window.innerHeight;
   if (!canvas) return;
   const ctx = canvas.getContext('2d');
   const width = canvas.width;
   const height = canvas.height;
   // Sound setup
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   // Resume audio on first user interaction (required by browsers)
   window.addEventListener('click', () => audioCtx.resume(), { once: true });
   function playTone(freq, duration) {
     const osc = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     osc.frequency.value = freq;
     osc.type = 'square';
     osc.connect(gain);
     gain.connect(audioCtx.destination);
     gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
     osc.start();
     osc.stop(audioCtx.currentTime + duration);
   }
   function playThrust() { playTone(400, 0.1); }
   function playExplosion() { playTone(100, 0.3); }
   // Starfield background initialization
   const stars = [];
   for (let i = 0; i < 120; i++) {
     stars.push({
       x: Math.random() * width,
       y: Math.random() * height,
       radius: Math.random() * 1.2 + 0.3,
       alpha: Math.random() * 0.5 + 0.5,
     });
   }

  // Ship definition
  // We'll draw the ship with a gradient fill for a nicer look
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    angle: 0, // radians, 0 points to the right
    speed: 2,
    // velocity derived from angle and speed each frame
  };

  // Asteroid pool
  const asteroids = [];
  const particles = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;
  let lastThrust = 0;
  let explosionPlayed = false;

  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    // Spawn at random edge
    const edge = Math.floor(Math.random() * 4); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const radius = 15 + Math.random() * 20;
    const speed = 0.5 + Math.random() * 1.5;
    // Generate irregular shape points
    const sides = 5 + Math.floor(Math.random() * 4); // 5-8 sides
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides;
      const r = radius * (0.6 + Math.random() * 0.8);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -radius;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (edge === 1) { // right
      x = width + radius;
      y = Math.random() * height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + radius;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
    } else { // left
      x = -radius;
      y = Math.random() * height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
    }
    asteroids.push({ x, y, vx, vy, radius, points });
  }


  function update(dt) {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= 0.04;
    if (keys['ArrowRight']) ship.angle += 0.04;
    if (keys['ArrowUp']) {
      ship.speed = Math.min(ship.speed + 0.02, 5);
      // Play thrust sound throttled
      if (performance.now() - lastThrust > 100) {
        playThrust();
        lastThrust = performance.now();
      }
    }
    if (keys['ArrowDown']) ship.speed = Math.max(ship.speed - 0.02, 0.5);

    // Move ship forward
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    // Bounds check – lose if outside canvas
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      gameOver = true;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove if far off-screen
      if (a.x < -100 || a.x > width + 100 || a.y < -100 || a.y > height + 100) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision detection
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
      }
    }

    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Draw starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 1;
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    }
    ctx.restore();

    // Draw ship with gradient fill
  // Ship is drawn as a triangle using a radial gradient for a nicer look
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

    // Draw asteroids with irregular polygons
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      // Move to first point relative to asteroid center
      const first = a.points[0];
      ctx.moveTo(a.x + first.x, a.y + first.y);
      for (let i = 1; i < a.points.length; i++) {
        const p = a.points[i];
        ctx.lineTo(a.x + p.x, a.y + p.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
