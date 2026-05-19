// Simple Asteroid Dodge game
// Canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  const ship = {
    x: 50,
    y: height / 2,
    radius: 15,
    speed: 4,
    dy: 0,
    draw() {
        // Ship with gradient and slight shadow
        const grad = ctx.createLinearGradient(this.x - 20, this.y - 10, this.x, this.y);
        grad.addColorStop(0, '#0f0');
        grad.addColorStop(1, '#050');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,255,0,0.5)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 20, this.y - 10);
        ctx.lineTo(this.x - 20, this.y + 10);
        ctx.closePath();
        ctx.fill();
        // Thrust flame when moving
        if (this.dy !== 0) {
          ctx.fillStyle = 'orange';
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.moveTo(this.x - 20, this.y);
          ctx.lineTo(this.x - 30, this.y - 5);
          ctx.lineTo(this.x - 30, this.y + 5);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      },
    update() {
      this.y += this.dy;
      if (this.y < this.radius) this.y = this.radius;
      if (this.y > height - this.radius) this.y = height - this.radius;
    }
  };

  // Asteroid pool and background stars
  const asteroids = [];
  const asteroidFrequency = 1500; // ms
  const asteroidSpeed = 3;
  const asteroidMinSize = 15;
  const asteroidMaxSize = 40;

  // Starfield for parallax background
  const stars = [];
  const starCount = 80;
  const starSpeed = 0.5;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        s: starSpeed + Math.random() * 0.5,
      });
    }
  }
  initStars();

  // Load sounds using data URIs (small beep and thrust)
  const thrustSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA'); // simple short sound
  const collisionSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA'); // same placeholder
  thrustSound.loop = true;
  let collisionPlayed = false;
  // Unlock audio on first user interaction
  const unlockAudio = () => {
    // Play silent buffer to enable audio context
    thrustSound.play().catch(() => {});
    collisionSound.play().catch(() => {});
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  function spawnAsteroid() {
    const size = Math.random() * (asteroidMaxSize - asteroidMinSize) + asteroidMinSize;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size * 2) + size,
      r: size,
    });
  }

  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;

  function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    return distance < a.radius + b.r;
  }

  function update(timestamp) {
    // Manage thrust sound
    if (ship.dy !== 0) {
      if (thrustSound.paused) thrustSound.play();
    } else {
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastSpawn || timestamp);
    if (delta > asteroidFrequency) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    // Update ship
    ship.update();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      // Remove off-screen
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      // Collision
      if (checkCollision(ship, a)) {
        if (!collisionPlayed) {
          collisionSound.play();
          collisionPlayed = true;
        }
        gameOver = true;
      }
    }

    // Update stars for parallax background
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.s;
      if (s.x < 0) {
        s.x = width + s.r;
        s.y = Math.random() * height;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars (already drawn as part of background) – they are drawn separately below
    // Draw stars for parallax effect
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship
    ship.draw();
    // Asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(100,100,100,0.4)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${seconds}s`, 10, 30);
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') ship.dy = -ship.speed;
    if (e.key === 'ArrowDown') ship.dy = ship.speed;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' && ship.dy < 0) ship.dy = 0;
    if (e.key === 'ArrowDown' && ship.dy > 0) ship.dy = 0;
  });

  // Start loop
  requestAnimationFrame(loop);
})();
