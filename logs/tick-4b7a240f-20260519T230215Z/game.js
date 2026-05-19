// Orbit Avoider game with enhanced graphics targeting <canvas id="game">
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // background starfield
  const starCount = 120;
  const stars = [];
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.5 + 0.5,
      });
    }
  }
  initStars();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context is resumed on first interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  const center = { x: width / 2, y: height / 2 };
  const planetRadius = 40;

  // Ship state
  const ship = {
    angle: 0, // radians
    radius: planetRadius + 80,
    angularSpeed: 0.02, // rad per frame
    radialSpeed: 0,
    size: 10,
  };

  const thrust = 0.4; // radial acceleration per input
  const maxRadialSpeed = 6;

  const powerUps = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    resumeAudio();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnPowerUp() {
    const angle = Math.random() * Math.PI * 2;
    const radius = planetRadius + 100 + Math.random() * 200;
    powerUps.push({ angle, radius, size: 6, collected: false });
  }
  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const radius = planetRadius + 150 + Math.random() * 250;
    const speed = 0.01 + Math.random() * 0.02;
    const rotation = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.04;
    asteroids.push({ angle, radius, speed, size: 12, rotation, rotationSpeed });
  }
    const angle = Math.random() * Math.PI * 2;
    const radius = planetRadius + 150 + Math.random() * 250;
    const speed = 0.01 + Math.random() * 0.02;
    asteroids.push({ angle, radius, speed, size: 12 });
  }

  // Simple timers
  let puTimer = 0, asTimer = 0;

  function update() {
    // animate stars (tiny twinkle)
    stars.forEach(s => {
      s.a += (Math.random() - 0.5) * 0.02;
      if (s.a < 0.3) s.a = 0.3;
      if (s.a > 0.9) s.a = 0.9;
    });
    if (gameOver) return;
    // thrust controls (ArrowUp = inward, ArrowDown = outward)
    if (keys['ArrowUp']) {
      ship.radialSpeed = Math.max(ship.radialSpeed - thrust, -maxRadialSpeed);
      playTone(400, 0.05); // thrust inward
    }
    if (keys['ArrowDown']) {
      ship.radialSpeed = Math.min(ship.radialSpeed + thrust, maxRadialSpeed);
      playTone(600, 0.05); // thrust outward
    }
    // radial friction
    ship.radialSpeed *= 0.98;
    // update radius
    ship.radius += ship.radialSpeed;
    // keep within reasonable bounds
    if (ship.radius < planetRadius + 20) ship.radius = planetRadius + 20;
    if (ship.radius > Math.max(width, height) / 2) { gameOver = true; }
    // advance angle
    ship.angle += ship.angularSpeed;
    // spawn items
    puTimer++; asTimer++;
    if (puTimer > 120) { spawnPowerUp(); puTimer = 0; }
    if (asTimer > 180) { spawnAsteroid(); asTimer = 0; }
    // move power‑ups (rotate with planet)
    powerUps.forEach(p => p.angle += ship.angularSpeed);
    // move asteroids
    asteroids.forEach(a => {
      a.angle += a.speed;
      // simple drift outward/inward for difficulty
      a.radius += Math.sin(a.angle * 3) * 0.2;
    });
    // collision detection
    powerUps.forEach(p => {
if (!p.collected && distShip(p) < (ship.size + p.size)) {
          p.collected = true;
          score++;
          playTone(800, 0.1); // power‑up collected
        }
    });
    asteroids.forEach(a => {
      if (distShip(a) < (ship.size + a.size)) {
        gameOver = true;
      }
    });
    // clean up collected/off‑screen items
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (powerUps[i].collected) powerUps.splice(i, 1);
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.radius < planetRadius + 10 || a.radius > Math.max(width, height)) asteroids.splice(i, 1);
    }
  }

  function distShip(obj) {
    const sx = center.x + Math.cos(ship.angle) * ship.radius;
    const sy = center.y + Math.sin(ship.angle) * ship.radius;
    const ox = center.x + Math.cos(obj.angle) * obj.radius;
    const oy = center.y + Math.sin(obj.angle) * obj.radius;
    const dx = sx - ox, dy = sy - oy;
    return Math.hypot(dx, dy);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.fill();
    });
    // planet with gradient
    const grad = ctx.createRadialGradient(center.x, center.y, planetRadius * 0.4, center.x, center.y, planetRadius);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planetRadius, 0, Math.PI * 2);
    ctx.fill();
    // ship with gradient
    const sx = center.x + Math.cos(ship.angle) * ship.radius;
    const sy = center.y + Math.sin(ship.angle) * ship.radius;
    const shipGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, ship.size * 2);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(
      sx + Math.cos(ship.angle + Math.PI / 2) * ship.size,
      sy + Math.sin(ship.angle + Math.PI / 2) * ship.size
    );
    ctx.lineTo(
      sx + Math.cos(ship.angle - Math.PI / 2) * ship.size,
      sy + Math.sin(ship.angle - Math.PI / 2) * ship.size
    );
    ctx.closePath();
    ctx.fill();
    // power‑ups
    ctx.fillStyle = '#ff0';
    powerUps.forEach(p => {
      const x = center.x + Math.cos(p.angle) * p.radius;
      const y = center.y + Math.sin(p.angle) * p.radius;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids with rotation
    asteroids.forEach(a => {
      const x = center.x + Math.cos(a.angle) * a.radius;
      const y = center.y + Math.sin(a.angle) * a.radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a.rotation);
      ctx.fillStyle = '#f44';
      ctx.beginPath();
      ctx.moveTo(0, -a.size);
      ctx.lineTo(a.size * 0.8, a.size);
      ctx.lineTo(-a.size * 0.8, a.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // start
  requestAnimationFrame(loop);
})();
