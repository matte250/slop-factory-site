// Cosmic Dodger game implementation
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Helper sounds
  const playBoost = () => playTone(600, 0.05);
  const playCollision = () => playTone(150, 0.3);
  const playSpawn = () => playTone(300, 0.1);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const resize = () => {
    // Create background gradient (dark space to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#020030');
    // Store gradient for drawing
    canvas.bgGrad = bgGrad;
    canvas.width = canvas.clientWidth * DPR;
    canvas.height = canvas.clientHeight * DPR;
    ctx.scale(DPR, DPR);
  };
    canvas.width = canvas.clientWidth * DPR;
    canvas.height = canvas.clientHeight * DPR;
    ctx.scale(DPR, DPR);
  };
  resize();
  window.addEventListener('resize', resize);

  // Player ship (enhanced graphics)
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width / DPR,
      y: Math.random() * canvas.height / DPR,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const ship = {
    // Trail particles will be emitted when boosting
    trailTimer: 0,
    trailInterval: 30 // ms between particles
  };
    x: canvas.width / (2 * DPR),
    y: canvas.height / (2 * DPR),
    angle: 0,
    radius: 10,
    speed: 0,
    boost: 0.1,
    turnSpeed: 0.07,
    friction: 0.99,
  };

  // Asteroids
  const asteroids = [];
  // Particle trail for ship boost
  const particles = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;

  // Game state
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const spawnAsteroid = () => {
    const radius = 15 + Math.random() * 20;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    // spawn outside canvas
    if (side === 0) { // top
      x = Math.random() * canvas.width / DPR;
      y = -radius;
    } else if (side === 1) { // right
      x = canvas.width / DPR + radius;
      y = Math.random() * canvas.height / DPR;
    } else if (side === 2) { // bottom
      x = Math.random() * canvas.width / DPR;
      y = canvas.height / DPR + radius;
    } else { // left
      x = -radius;
      y = Math.random() * canvas.height / DPR;
    }
    // direction towards centre with some variance
    const angleToCenter = Math.atan2(canvas.height / (2 * DPR) - y, canvas.width / (2 * DPR) - x);
    const speed = 0.5 + Math.random() * 0.5;
    vx = Math.cos(angleToCenter) * speed;
    vy = Math.sin(angleToCenter) * speed;
    asteroids.push({ x, y, vx, vy, radius });
  };

  const update = (dt) => {
    // Emit boost particles
    if (keys['ArrowUp']) {
      ship.trailTimer += dt;
      while (ship.trailTimer > ship.trailInterval) {
        ship.trailTimer -= ship.trailInterval;
        particles.push({
          x: ship.x,
          y: ship.y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          life: 300,
          maxLife: 300,
        });
      }
    } else {
      ship.trailTimer = 0;
    }
    if (gameOver) return;
    // Controls: ArrowLeft/Right rotate, ArrowUp boost
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp']) {
      ship.speed += ship.boost;
      // Play boost sound
      playTone(600, 0.05);
    }
    // Apply movement
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    ship.speed *= ship.friction;
    // Wrap ship? No, drift off ends game
    if (
      ship.x < -ship.radius || ship.x > canvas.width / DPR + ship.radius ||
      ship.y < -ship.radius || ship.y > canvas.height / DPR + ship.radius
    ) {
      gameOver = true;
    }
    // Update asteroids
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        playCollision();
        gameOver = true;
        break;
      }
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (
        a.x < -a.radius || a.x > canvas.width / DPR + a.radius ||
        a.y < -a.radius || a.y > canvas.height / DPR + a.radius
      ) {
        asteroids.splice(i, 1);
      }
    }
    // Spawn new asteroids
if (performance.now() - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        playSpawn();
        lastSpawn = performance.now();
      }
    // Update score (seconds survived)
    score += dt / 1000;
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship
    // Ship with gradient and glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Create gradient for ship body
    const grad = ctx.createLinearGradient(-15, 0, 15, 0);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#0ff');
    ctx.fillStyle = grad;
    // Add glow effect
    ctx.shadowColor = 'rgba(0,255,255,0.7)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#ccc');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw particles
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / (2 * DPR), canvas.height / (2 * DPR) - 10);
      ctx.fillText('Final Score: ' + Math.floor(score), canvas.width / (2 * DPR), canvas.height / (2 * DPR) + 20);
    }
  };

  const loop = (now) => {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
