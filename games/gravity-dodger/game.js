// Gravity Dodger – concise implementation
// Canvas with id="game" must exist in the host HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  const center = { x: width / 2, y: height / 2 };
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  let thrustOsc = null;
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, dur);
  };
  // ----- Game parameters -----
  const planetRadius = 30;
  const shipRadius = 8;
  const starRadius = 5;
  const asteroidRadius = 10;
  const maxFuel = 1000;
  const thrustPower = 0.04;
  const rotateSpeed = 0.03;
  const asteroidBaseSpeed = 0.0015;
  const asteroidSpawnInterval = 2000; // ms

  // ----- State -----
  let angle = 0; // radians
  let radius = planetRadius + 40; // distance from planet centre
  let fuel = maxFuel;
  let score = 0;
  let stars = [];
  let asteroids = [];
  let lastAsteroidTime = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  let thrustActive = false;

  // Utility
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  const spawnStar = () => {
    const a = rand(0, Math.PI * 2);
    const r = rand(planetRadius + 50, Math.min(width, height) / 2 - 20);
    stars.push({ angle: a, radius: r });
  };

  const spawnAsteroid = () => {
    const a = rand(0, Math.PI * 2);
    const r = rand(planetRadius + 60, Math.min(width, height) / 2 - 30);
    const speed = asteroidBaseSpeed + 0.0001 * score; // increase with score
    const dir = Math.random() < 0.5 ? 1 : -1; // clockwise or counter
    asteroids.push({ angle: a, radius: r, speed, dir });
  };

  // Initial star
  spawnStar();

  const update = (dt) => {
    if (gameOver) return;
    // Controls
    if (keys['ArrowLeft']) angle -= rotateSpeed * dt;
    if (keys['ArrowRight']) angle += rotateSpeed * dt;
    if (keys['ArrowUp'] && fuel > 0) {
      radius += thrustPower * dt;
      fuel -= dt * 0.1;
      thrustActive = true;
      // Play thrust sound
      playTone(300, 80);
    } else {
      thrustActive = false;
    }
    if (keys['ArrowDown'] && fuel > 0) {
      radius = Math.max(radius - thrustPower * dt, planetRadius);
      fuel -= dt * 0.1;
    }

    // Ship position
    const shipX = center.x + Math.cos(angle) * radius;
    const shipY = center.y + Math.sin(angle) * radius;

    // Collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const sx = center.x + Math.cos(s.angle) * s.radius;
      const sy = center.y + Math.sin(s.angle) * s.radius;
      if (distance(shipX, shipY, sx, sy) < shipRadius + starRadius) {
        score++;
        stars.splice(i, 1);
        spawnStar();
      }
    }

    // Update asteroids
    const now = performance.now();
    if (now - lastAsteroidTime > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroidTime = now;
    }
    asteroids.forEach(a => {
      a.angle += a.dir * a.speed * dt;
    });

    // Collisions with asteroids
    for (const a of asteroids) {
      const ax = center.x + Math.cos(a.angle) * a.radius;
      const ay = center.y + Math.sin(a.angle) * a.radius;
      if (distance(shipX, shipY, ax, ay) < shipRadius + asteroidRadius) {
        gameOver = true;
      }
    }

    // Collision with planet
    if (radius - shipRadius <= planetRadius) gameOver = true;
    // Fuel out
    if (fuel <= 0) gameOver = true;
  };

  const draw = () => {
    // Background gradient (space)
    const bgGrad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, Math.max(width,height)/2);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(center.x, center.y, planetRadius * 0.2, center.x, center.y, planetRadius);
    planetGrad.addColorStop(0, '#4a90e2');
    planetGrad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ship - triangle pointing forward with glow
    const shipX = center.x + Math.cos(angle) * radius;
    const shipY = center.y + Math.sin(angle) * radius;
    // Orientation vectors
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const perpX = -dirY;
    const perpY = dirX;
    const tipX = shipX + dirX * shipRadius;
    const tipY = shipY + dirY * shipRadius;
    const leftX = shipX + perpX * shipRadius * 0.6;
    const leftY = shipY + perpY * shipRadius * 0.6;
    const rightX = shipX - perpX * shipRadius * 0.6;
    const rightY = shipY - perpY * shipRadius * 0.6;
    // Ship glow via shadow
    ctx.shadowColor = thrustActive ? 'rgba(255,165,0,0.8)' : 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = thrustActive ? 12 : 6;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    // Reset shadow to avoid affecting other draws
    ctx.shadowBlur = 0;
    // Thrust flame
    if (thrustActive) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.lineTo(shipX - dirX * shipRadius * 1.5, shipY - dirY * shipRadius * 1.5);
      ctx.closePath();
      ctx.fill();
    }

    // Stars with subtle glow
    for (const s of stars) {
      const sx = center.x + Math.cos(s.angle) * s.radius;
      const sy = center.y + Math.sin(s.angle) * s.radius;
      const grad = ctx.createRadialGradient(sx, sy, starRadius * 0.2, sx, sy, starRadius);
      grad.addColorStop(0, '#fff9c4');
      grad.addColorStop(1, '#f1c40f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, starRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Asteroids with radial gradient
    for (const a of asteroids) {
      const ax = center.x + Math.cos(a.angle) * a.radius;
      const ay = center.y + Math.sin(a.angle) * a.radius;
      const grad = ctx.createRadialGradient(ax, ay, asteroidRadius * 0.2, ax, ay, asteroidRadius);
      grad.addColorStop(0, '#bdc3c7');
      grad.addColorStop(1, '#7f8c8d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ax, ay, asteroidRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 20);
    }
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
