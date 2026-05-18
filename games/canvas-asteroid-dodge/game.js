// Game based on IDEA.md – simple asteroid dodge
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ---- utilities -------------------------------------------------
  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ---- background ------------------------------------------------
  const drawBackground = () => {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001d3d'); // dark space top
    grad.addColorStop(1, '#000814'); // deeper bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  };

  // ---- starfield -------------------------------------------------
  const stars = Array.from({ length: 120 }, () => ({
    x: rand(0, width),
    y: rand(0, height),
    r: rand(0.5, 2),
    a: rand(0.3, 1) // alpha for twinkle
  }));
  const drawStars = () => {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // slight twinkle change
    stars.forEach(s => {
      s.a += (Math.random() - 0.5) * 0.02;
      if (s.a < 0.3) s.a = 0.3;
      if (s.a > 1) s.a = 1;
    });
  };

  // ---- player ship -----------------------------------------------
  const ship = { x: width / 2, y: height - 60, size: 20, speed: 4, dx: 0, dy: 0 };
  const drawShip = () => {
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.size, ship.x, ship.y + ship.size);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#004400');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    // subtle outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  const updateShip = () => {
    ship.x += ship.dx;
    ship.y += ship.dy;
    // keep inside canvas
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y));
  };

  // ---- audio ------------------------------------------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // ---- input -----------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => {
    if (!keys[e.key]) {
      // play thrust sound on new key press
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) playTone(300);
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  const handleInput = () => {
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
  };

  // ---- asteroids -------------------------------------------------
  const asteroids = [];
  const spawnAsteroid = () => {
    const size = rand(10, 30);
    asteroids.push({
      x: rand(0, width),
      y: -size,
      r: size,
      speed: rand(1, 3),
      rot: rand(0, Math.PI * 2), // rotation angle
      rotSpeed: rand(-0.02, 0.02) // rotation per frame
    });
  };
  const updateAsteroids = () => {
    asteroids.forEach(a => {
      a.y += a.speed;
      a.rot += a.rotSpeed;
    });
    // remove off‑screen
    while (asteroids.length && asteroids[0].y - asteroids[0].r > height) asteroids.shift();
  };
  const drawAsteroids = () => {
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  // ---- collision & score -----------------------------------------
  let score = 0;
  let gameOver = false;
  let explosionTriggered = false;
  const checkCollision = () => {
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < ship.size + a.r) {
        gameOver = true;
        break;
      }
    }
  };

  // ---- explosion (simple particles) ------------------------------
  const particles = [];
  const createExplosion = (x, y) => {
    // play explosion sound
    playTone(100, 0.3);
    for (let i = 0; i < 30; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1, 4);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: rand(30, 60) });
    }
  };
  const updateParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  };
  const drawParticles = () => {
    ctx.fillStyle = '#ff0';
    particles.forEach(p => { ctx.fillRect(p.x, p.y, 2, 2); });
  };

  // ---- main loop ------------------------------------------------
  let lastSpawn = 0;
  const loop = (timestamp) => {
    if (gameOver) {
      createExplosion(ship.x, ship.y);
      // draw final frame & stop updates after explosion finishes
      ctx.clearRect(0, 0, width, height);
      drawStars();
      drawAsteroids();
      drawShip();
      updateParticles();
      drawParticles();
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText(`Score: ${Math.floor(score)}`, width / 2 - 50, height / 2 + 30);
      if (particles.length) requestAnimationFrame(loop);
      return;
    }

    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawStars();
    handleInput();
    updateShip();
    drawShip();

    // asteroids
    if (timestamp - lastSpawn > 800) { spawnAsteroid(); lastSpawn = timestamp; }
    updateAsteroids();
    drawAsteroids();

    // collision
    checkCollision();
    if (gameOver) { createExplosion(ship.x, ship.y); }

    // particles (explosion after collision)
    updateParticles();
    drawParticles();

    // score
    score += 0.02;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    requestAnimationFrame(loop);
  };

  // start
  requestAnimationFrame(loop);
})();
