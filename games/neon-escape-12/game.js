// Simple Neon Escape game based on IDEA.md
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');

  // Audio context and simple tone functions
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playBoost = () => playTone(600, 0.08);
  const playCrash = () => playTone(200, 0.5);

  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Background gradient for a neon vibe
  const drawBackground = () => {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001'); // dark blue at top
    grad.addColorStop(1, '#000'); // black at bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Ship definition – a neon triangle with glow
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 20,
    height: 30,
    speedX: 0,
    speedY: 0,
    maxSpeed: 4,
    boost: -6,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  // Obstacles – neon rectangles with glow
  const obstacles = [];
  const obstacleFreq = 1500; // ms between spawns
  const obstacleSpeed = 2;
  let lastSpawn = 0;

  // Particle effect for ship boost
  const particles = [];
  const spawnParticle = (x, y) => {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 1.5 - 0.5,
      life: 30 + Math.random() * 20,
    });
  };

  // Game state
  let score = 0;
  let running = true;

  const spawnObstacle = () => {
    const width = 30 + Math.random() * 40;
    const x = Math.random() * (canvas.width - width);
    obstacles.push({ x, y: -30, width, height: 30 });
  };

  const update = (delta) => {
    // Update ship based on input
    ship.speedX = 0;
    if (keys.ArrowLeft) ship.speedX = -ship.maxSpeed;
    if (keys.ArrowRight) ship.speedX = ship.maxSpeed;
    ship.x += ship.speedX;
    // Keep within bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.width > canvas.width) ship.x = canvas.width - ship.width;

    // Boost upward when ArrowUp is held
    if (keys.ArrowUp) {
      ship.y += ship.boost; // negative boost moves up
      // Emit particles for boost effect
      for (let i = 0; i < 2; i++) spawnParticle(ship.x + ship.width / 2, ship.y + ship.height);
      // Play boost sound
      playBoost();
    } else {
      ship.y += 1; // slight gravity pull downwards
    }
    if (ship.y < 0) ship.y = 0;
    if (ship.y + ship.height > canvas.height) ship.y = canvas.height - ship.height;

    // Spawn obstacles over time
    if (performance.now() - lastSpawn > obstacleFreq) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Move obstacles downward
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      if (o.y > canvas.height) obstacles.splice(i, 1); // remove off‑screen
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.width &&
        ship.x + ship.width > o.x &&
        ship.y < o.y + o.height &&
        ship.y + ship.height > o.y
      ) {
        // Play crash sound
        playCrash();
        running = false;
        break;
      }
    }

    // Update score
    score += delta * 0.01;
  };

  const drawShip = () => {
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    const gradient = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.height);
    gradient.addColorStop(0, '#0ff');
    gradient.addColorStop(1, '#00f');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawObstacles = () => {
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.height);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#800080');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
    ctx.restore();
  };

  const drawParticles = () => {
    ctx.save();
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    for (const p of particles) {
      ctx.fillRect(p.x, p.y, 2, 2);
    }
    ctx.restore();
  };

  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  };

  const loop = (timestamp) => {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
      ctx.fillText('Score: ' + Math.floor(score), canvas.width / 2 - 60, canvas.height / 2 + 30);
      return;
    }
    // Draw background first
    drawBackground();
    const delta = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(delta);
    drawShip();
    drawObstacles();
    drawParticles();
    drawScore();
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
