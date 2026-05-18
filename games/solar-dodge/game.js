// Minimalist "Solar Dodge" game
// Canvas with id="game" is expected in the HTML.
// The ship orbits a sun at the canvas center. Left/Right arrows rotate the ship.
// Up arrow applies thrust away from the sun. Asteroids spawn at the edge and drift toward the center.
// Collision ends the game. Score = time survived (seconds).

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or a default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  const sunRadius = 30;

  // background star field
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  const ship = {
    angle: 0, // radians, 0 points to the right
    radius: 100, // distance from center
    size: 10,
    vx: 0,
    vy: 0,
    angularSpeed: 0.03, // radians per frame when rotating
    thrust: 0.1,
  };

  // thrust particles
  const particles = [];

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrustTime = 0;

  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  const asteroidSpeed = 1.2;

  let lastSpawn = performance.now();
  let startTime = performance.now();
  let running = true;
  let collisionPlayed = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    // spawn at random edge position
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
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
    // direction toward center
    const angle = Math.atan2(center.y - y, center.x - x);
    dx = Math.cos(angle) * asteroidSpeed;
    dy = Math.sin(angle) * asteroidSpeed;
    const size = 8 + Math.random() * 12;
    // add rotation for visual interest
    const rot = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02;
    asteroids.push({ x, y, dx, dy, size, rot, rotSpeed });
  }

  function update(dt) {
    // ship rotation
    if (keys.ArrowLeft) ship.angle -= ship.angularSpeed;
    if (keys.ArrowRight) ship.angle += ship.angularSpeed;
    // thrust moves ship outward from center and creates particles
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // thrust sound (short burst)
      const now = performance.now();
      if (now - lastThrustTime > 100) { // limit rate
        playTone(300, 0.05);
        lastThrustTime = now;
      }
      // create thrust particle at ship's rear
      const tipX = center.x + Math.cos(ship.angle) * ship.radius;
      const tipY = center.y + Math.sin(ship.angle) * ship.radius;
      particles.push({
        x: tipX,
        y: tipY,
        vx: -Math.cos(ship.angle) * (Math.random() * 0.5 + 0.5),
        vy: -Math.sin(ship.angle) * (Math.random() * 0.5 + 0.5),
        radius: Math.random() * 2 + 1,
        life: 30,
      });
    }
    // update ship position (polar to cartesian)
    ship.radius += (ship.vx * Math.cos(ship.angle) + ship.vy * Math.sin(ship.angle)) * dt * 0.01;
    // clamp radius to stay onscreen
    const maxR = Math.min(canvas.width, canvas.height) / 2 - ship.size - 5;
    if (ship.radius < sunRadius + 20) ship.radius = sunRadius + 20;
    if (ship.radius > maxR) ship.radius = maxR;
    // damping
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // move asteroids
    for (const a of asteroids) {
      a.x += a.dx;
      a.y += a.dy;
    }
    // collision detection
    const shipX = center.x + Math.cos(ship.angle) * ship.radius;
    const shipY = center.y + Math.sin(ship.angle) * ship.radius;
    for (const a of asteroids) {
      const dx = a.x - shipX;
      const dy = a.y - shipY;
      if (Math.hypot(dx, dy) < a.size + ship.size) {
        running = false;
        if (!collisionPlayed) {
          playTone(150, 0.4);
          collisionPlayed = true;
        }
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw stars background
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw sun with gradient
    const grad = ctx.createRadialGradient(center.x, center.y, sunRadius * 0.2, center.x, center.y, sunRadius);
    grad.addColorStop(0, 'yellow');
    grad.addColorStop(1, 'orange');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    // draw ship
    const shipX = center.x + Math.cos(ship.angle) * ship.radius;
    const shipY = center.y + Math.sin(ship.angle) * ship.radius;
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(ship.angle);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(-ship.size, -ship.size / 2);
    ctx.lineTo(ship.size, 0);
    ctx.lineTo(-ship.size, ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // draw asteroids with rotation
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // update rotation
      a.rot += a.rotSpeed;
    }
    // draw thrust particles
    ctx.fillStyle = 'orange';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw score
    const score = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last ?? timestamp);
    loop.last = timestamp;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
