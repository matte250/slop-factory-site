// Simple endless side-scroll runner based on IDEA.md
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    oscillator.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      oscillator.stop(audioCtx.currentTime + 0.05);
    }, duration);
  };
  const playThrust = () => playTone(440, 100);
  const playCollision = () => playTone(100, 300);

  // Canvas resize and background init
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  };
  window.addEventListener('resize', resize);
  resize();

  // Starfield background
  const stars = [];
  const starCount = 120;
  const initStars = () => {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.4 + 0.1,
      });
    }
  };
  const drawStars = () => {
    ctx.fillStyle = '#0b0d17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed;
      if (s.x < 0) s.x = canvas.width;
    }
  };

  // Player ship (triangle)
  const ship = {
    x: 80,
    y: canvas.height / 2,
    w: 30,
    h: 20,
    speed: 5,
    dy: 0,
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      if (this.y < 0) this.y = 0;
      if (this.y + this.h > canvas.height) this.y = canvas.height - this.h;
    },
  };

  // Input handling (arrow keys or mouse)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top - ship.h / 2;
  });

  // Asteroids
  const asteroids = [];
  const spawnInterval = 1300;
  let lastSpawn = 0;
  const spawnAsteroid = () => {
    const r = Math.random() * 30 + 10;
    asteroids.push({
      x: canvas.width + r,
      y: Math.random() * (canvas.height - r * 2),
      r,
      speed: Math.random() * 2 + 2,
    });
  };
  const updateAsteroids = () => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  };
  const drawAsteroids = () => {
    for (const a of asteroids) {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      gradient.addColorStop(0, '#ffb199');
      gradient.addColorStop(1, '#c44500');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Collision detection
  const collides = () => {
    for (const a of asteroids) {
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      const dx = a.x - closestX;
      const dy = a.y - closestY;
      if (dx * dx + dy * dy < a.r * a.r) return true;
    }
    return false;
  };

  // Score
  let score = 0;
  let gameOver = false;
  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
  };

  // Main loop
  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }

    drawStars();

    // Input
    ship.dy = 0;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;

    ship.update();
    ship.draw();

    updateAsteroids();
    drawAsteroids();

    if (collides()) gameOver = true;

    score += 0.06;
    drawScore();

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
// Targets <canvas id="game"></canvas>
(() => {




  // Player ship
  const ship = {
    x: 80,
    y: canvas.height / 2,
    w: 30,
    h: 20,
    speed: 5,
    dy: 0,
    draw() {
      // Draw ship as a simple triangle
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      // keep inside vertical bounds
      if (this.y < 0) this.y = 0;
      if (this.y + this.h > canvas.height) this.y = canvas.height - this.h;
    }
  };

  // Input handling (arrow keys or mouse)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top - ship.h / 2;
  });

  // Asteroids
  const asteroids = [];
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  const spawnAsteroid = () => {
    const size = Math.random() * 40 + 10;
    const speed = Math.random() * 3 + 2; // leftward speed
    asteroids.push({
      x: canvas.width + size,
      y: Math.random() * (canvas.height - size),
      r: size,
      speed,
    });
  };

  const updateAsteroids = dt => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  };

  const drawAsteroids = () => {
    ctx.fillStyle = '#f55';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Collision detection
  const collides = () => {
    for (const a of asteroids) {
      // simple AABB-circle test
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      const dx = a.x - closestX;
      const dy = a.y - closestY;
      if (dx * dx + dy * dy < a.r * a.r) return true;
    }
    return false;
  };

  // Score
  let score = 0;
  let gameOver = false;
  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 30);
  };

  // Main loop
  const loop = timestamp => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
      return;
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Input
    ship.dy = 0;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;

    ship.update();
    ship.draw();
    updateAsteroids(timestamp);
    drawAsteroids();

    if (collides()) {
      gameOver = true;
    }

    score += 0.06; // approx distance per frame
    drawScore();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
