// Simple Neon Dodge game
// Canvas with id="game" expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set a default size if not defined in HTML.
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const center = { x: canvas.width / 2, y: canvas.height / 2 };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, length) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + length / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + length / 1000);
  }
  function thrustSound() { playTone(300, 100); }
  function explosionSound() { playTone(100, 500); }

  // Ship definition
  const ship = {
    x: center.x,
    y: center.y,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 12,
    thrust: 0.2,
    rotateSpeed: 0.07,
  };

  // Asteroid definition
  const asteroids = [];
  const asteroidSpeed = 1.2;
  const spawnInterval = 2000; // ms
  const lastSpawn = { time: 0 };
  // Star field for background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.5 + 0.5,
    });
  }

  let score = 0;
  let lastTime = performance.now();

  function spawnAsteroid() {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    if (edge === 0) { // top
      x = Math.random() * canvas.width;
      y = -20;
    } else if (edge === 1) { // right
      x = canvas.width + 20;
      y = Math.random() * canvas.height;
    } else if (edge === 2) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + 20;
    } else { // left
      x = -20;
      y = Math.random() * canvas.height;
    }
    // direction toward centre
    const angle = Math.atan2(center.y - y, center.x - x);
    dx = Math.cos(angle) * asteroidSpeed;
    dy = Math.sin(angle) * asteroidSpeed;
    const radius = 8 + Math.random() * 12;
    // random neon color for each asteroid
    const colors = ['#ff0', '#f0f', '#0ff', '#0f0', '#f60'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    asteroids.push({ x, y, dx, dy, radius, color });
  }

  function update(dt) {
    // Controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship within bounds (wrap)
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Spawn asteroids
    if (performance.now() - lastSpawn.time > spawnInterval) {
      spawnAsteroid();
      lastSpawn.time = performance.now();
    }

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.dx;
      a.y += a.dy;
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // Game over – stop the loop
        cancelAnimationFrame(animId);
        explosionSound();
        alert('Game Over! Score: ' + Math.floor(score));
        return;
      }
    }

    // Increase score
    score += dt * 0.01;
  }

  function draw() {
    // Draw background with fading effect for motion blur
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // dark translucent overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw star field (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.brightness;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw ship (neon triangle with glow)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Draw asteroids with neon glow (color per asteroid)
    for (const a of asteroids) {
      ctx.save();
      const col = a.color || '#f60';
      ctx.shadowColor = col;
      ctx.shadowBlur = 8;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp') thrustSound();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
