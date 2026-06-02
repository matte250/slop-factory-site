// Simple Asteroid Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Sounds
  const moveSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='); // short beep
  const crashSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='); // placeholder silence

  // Ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    move: 0, // -1 left, 1 right
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#060');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.move * this.speed;
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > width) this.x = width - this.w;
    }
  };

  // Asteroids
  const asteroids = [];
  // Starfield background
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.5 + Math.random() * 0.5
    });
  }
  function updateStars(dt) {
    for (const s of stars) {
      s.y += s.speed * dt * 0.03; // slower movement
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = 0;
        s.radius = Math.random() * 1.5 + 0.5;
        s.speed = 0.5 + Math.random() * 0.5;
      }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3
    });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      if (ship.move !== -1) moveSound.currentTime = 0;
      ship.move = -1;
      moveSound.play();
    } else if (e.key === 'ArrowRight') {
      if (ship.move !== 1) moveSound.currentTime = 0;
      ship.move = 1;
      moveSound.play();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' && ship.move === -1) ship.move = 0;
    else if (e.key === 'ArrowRight' && ship.move === 1) ship.move = 0;
  });

  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  function rectsIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    if (gameOver) return;
    ship.update();
    updateStars(dt);
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) {
        asteroids.splice(i, 1);
        score++;
      } else if (rectsIntersect(ship, a)) {
        crashSound.currentTime = 0;
        crashSound.play();
        gameOver = true;
      }
    }
    // spawn new asteroids
    lastSpawn += dt;
    if (lastSpawn > 800) { // every 0.8s
      spawnAsteroid();
      lastSpawn = 0;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ship.draw();
    // draw stars background
    drawStars();
    // draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
