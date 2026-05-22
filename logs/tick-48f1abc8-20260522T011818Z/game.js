// Neon Void Escape – minimal canvas game
// Canvas element with id="game" must exist in the host HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Generate starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
    });
  }
  const height = canvas.height = canvas.clientHeight;

  // Ship state
  const ship = {
    x: width / 2,
    y: height * 0.8,
    angle: -Math.PI / 2,
    radius: 8,
    vx: 0,
    vy: 0,
    thrust: 0.05,
    rotateSpeed: 0.07,
  };

  // Obstacles array
  const obstacles = [];
  const particles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const size = Math.random() * 30 + 15;
    const x = Math.random() * (width - size) + size / 2;
    const speed = Math.random() * 1.5 + 0.5;
    obstacles.push({ x, y: -size, size, speed });
  }

  function update() {
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
    }
    if (gameOver) return;
    // Controls
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight'] || keys['d']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp'] || keys['w']) {
      // Thrust sound
      playTone(440, 0.04);
      // Create thrust particles at ship tip
      const tipX = ship.x + Math.cos(ship.angle) * 12;
      const tipY = ship.y + Math.sin(ship.angle) * 12;
      particles.push({
        x: tipX,
        y: tipY,
        vx: -Math.cos(ship.angle) * (Math.random() * 0.5 + 0.2),
        vy: -Math.sin(ship.angle) * (Math.random() * 0.5 + 0.2),
        life: 30,
        size: Math.random() * 3 + 2,
      });
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Apply velocity & wrap
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship within canvas (wrap horizontally, bounce vertically)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y = 0, ship.vy = 0;
    if (ship.y > height) ship.y = height, ship.vy = 0;

    // Obstacles
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Remove off‑screen
      if (o.y - o.size > height) {
        obstacles.splice(i, 1);
        score++;
        continue;
      }
      // Collision detection (circle‑rect approximation)
      const dx = Math.abs(ship.x - o.x);
      const dy = Math.abs(ship.y - o.y);
      if (dx < o.size / 2 + ship.radius && dy < o.size / 2 + ship.radius) {
        // Collision sound
        playTone(150, 0.3);
        gameOver = true;
      }
    }
  }

  function draw() {
    // Clear with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw starfield background
    ctx.fillStyle = '#444';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw particles (thrust glow)
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw ship (neon triangle with glow)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    // Draw obstacles (neon squares with glow)
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 6;
    obstacles.forEach(o => {
      ctx.fillRect(o.x - o.size / 2, o.y - o.size / 2, o.size, o.size);
    });
    // Reset shadow for UI elements
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
