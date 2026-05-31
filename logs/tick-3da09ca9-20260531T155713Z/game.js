// Orbit Dodge – enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Resize canvas and initialize stars
  const stars = [];
  function initStars() {
    stars.length = 0;
    const count = Math.max(50, Math.floor((canvas.width * canvas.height) / 5000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
      });
    }
  }
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    planet.x = canvas.width / 2;
    planet.y = canvas.height / 2;
    initStars();
  }
  window.addEventListener('resize', resize);
  resize();

  const planet = { x: canvas.width / 2, y: canvas.height / 2, r: 30 };

  const ship = {
    angle: 0, // radians around planet
    radius: 80, // distance from planet centre
    speedAngle: 0, // angular velocity
    speedRadial: 0, // radial velocity
    r: 8,
    maxSpeed: 4,
    thrust: 0.1,
    brake: 0.05,
    rotateSpeed: 0.04,
  };

  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function ensureAudioRunning() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    ensureAudioRunning();
    if (e.key === 'ArrowUp') playSound(440, 0.07);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid handling
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    // spawn at random edge position
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1.5 + Math.random();
    if (side === 0) { // top
      x = Math.random() * canvas.width;
      y = -20;
    } else if (side === 1) { // right
      x = canvas.width + 20;
      y = Math.random() * canvas.height;
    } else if (side === 2) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + 20;
    } else { // left
      x = -20;
      y = Math.random() * canvas.height;
    }
    // direction towards planet centre
    const dx = planet.x - x;
    const dy = planet.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, r: 10 + Math.random() * 5 });
  }

  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    // handle input
    if (keys['ArrowLeft']) ship.speedAngle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.speedAngle += ship.rotateSpeed;
    if (keys['ArrowUp']) ship.speedRadial += ship.thrust;
    if (keys['ArrowDown']) ship.speedRadial -= ship.brake;

    // apply friction
    ship.speedRadial *= 0.98;
    ship.speedAngle *= 0.99;

    // update ship position
    ship.angle += ship.speedAngle;
    ship.radius += ship.speedRadial;
    // clamp radius to stay outside planet
    const minRadius = planet.r + ship.r + 5;
    if (ship.radius < minRadius) ship.radius = minRadius;
    if (ship.radius > Math.min(canvas.width, canvas.height) / 2 - ship.r) ship.radius = Math.min(canvas.width, canvas.height) / 2 - ship.r;

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }

    // collision detection
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    for (const a of asteroids) {
      const dist = Math.hypot(a.x - sx, a.y - sy);
      if (dist < a.r + ship.r) {
        playSound(150, 0.4); // collision beep
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // clear background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars background
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with radial gradient
    const grad = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // ship as triangle
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    const shipAngle = Math.atan2(sy - planet.y, sx - planet.x);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(
      sx + Math.cos(shipAngle) * ship.r * 2,
      sy + Math.sin(shipAngle) * ship.r * 2
    );
    ctx.lineTo(
      sx + Math.cos(shipAngle + Math.PI * 0.8) * ship.r,
      sy + Math.sin(shipAngle + Math.PI * 0.8) * ship.r
    );
    ctx.lineTo(
      sx + Math.cos(shipAngle - Math.PI * 0.8) * ship.r,
      sy + Math.sin(shipAngle - Math.PI * 0.8) * ship.r
    );
    ctx.closePath();
    ctx.fill();
    // asteroids with gray stroke
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
