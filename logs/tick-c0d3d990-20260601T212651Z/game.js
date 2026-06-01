// Minimal Cosmic Dodger implementation
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // gentle envelope
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Full‑screen canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // recreate stars for new size
    initStars();
  };
  window.addEventListener('resize', resize);
  resize();

  // ----- Starfield -----
  const stars = [];
  const starCount = 200;
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.05 + 0.02,
        bright: Math.random() * 0.5 + 0.5,
      });
    }
  }
  function updateStars(dt) {
    for (const s of stars) {
      s.y += s.speed * dt;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
        s.radius = Math.random() * 1.5 + 0.5;
        s.speed = Math.random() * 0.05 + 0.02;
        s.bright = Math.random() * 0.5 + 0.5;
      }
    }
  }
  // ----- Game objects -----
  const ship = {
    x: 80,
    y: canvas.height / 2,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
    draw() {
      // ship with gradient fill and slight glow
      const grad = ctx.createLinearGradient(this.x - this.size, this.y - this.size / 2, this.x, this.y + this.size / 2);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#3f3');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.size, this.y + this.size / 2);
      ctx.lineTo(this.x - this.size, this.y - this.size / 2);
      ctx.closePath();
      ctx.fill();
      // subtle outline
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep within bounds
      this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
      this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
    },
  };

  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const y = Math.random() * (canvas.height - radius * 2) + radius;
    const speed = Math.random() * 2 + 2 + (score / 30); // increase with score
    asteroids.push({ x: canvas.width + radius, y, radius, speed });
    // subtle spawn sound
    playBeep(400, 0.05);
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
    // spawn new
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function drawAsteroids() {
    // draw asteroids with radial gradient shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(0.7, '#555');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      // subtle outer glow
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
  }

  function drawStars() {
    // dark space gradient background
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#001');
    grd.addColorStop(1, '#000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw pre‑generated stars with subtle twinkle
    stars.forEach(s => {
      const starGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
      const bright = s.bright * (0.7 + 0.3 * Math.random()); // slight flicker
      starGrad.addColorStop(0, `rgba(255,255,255,${bright})`);
      starGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function handleInput() {
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowUp || keys.w) ship.dy = -ship.speed;
    if (keys.ArrowDown || keys.s) ship.dy = ship.speed;
    if (keys.ArrowLeft || keys.a) ship.dx = -ship.speed;
    if (keys.ArrowRight || keys.d) ship.dx = ship.speed;
  }

  // ----- Collision detection -----
  function checkCollision() {
    for (const a of asteroids) {
      const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (dist < a.radius + ship.size / 2) {
        return true;
      }
    }
    return false;
  }

  // ----- Score -----
  let startTime = performance.now();
  let score = 0;
  function updateScore() {
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }
  function drawScore() {
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  // ----- Main loop -----
  let gameOver = false;
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}s`, canvas.width / 2, canvas.height / 2 + 40);
      return;
    }
    const now = performance.now();
    const dt = now - (window.lastTime || now);
    window.lastTime = now;

    // update and draw background stars
    updateStars(dt);
    drawStars();
    handleInput();
    ship.update();
    updateAsteroids(dt);
    ship.draw();
    drawAsteroids();
    updateScore();
    drawScore();

    if (checkCollision()) {
      // collision sound
      playBeep(150, 0.2);
      gameOver = true;
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
