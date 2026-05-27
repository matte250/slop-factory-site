// Asteroid Runner – enhanced graphics
// Targets the <canvas id="game"> element and provides richer visuals
// Ship drawn as a triangle, background starfield, and shaded asteroids.
// Assumes there is a <canvas id="game"></canvas> in the HTML

(function() {
  const canvas = document.getElementById('game');
  // create a subtle background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001028');
  bgGradient.addColorStop(1, '#000000');

  // Sound effects (using data URIs for small placeholder sounds)
  const thrustSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='); // short beep placeholder
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='); // short beep placeholder

  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Ship
  const ship = {
    x: 80,
    y: height / 2,
    width: 30,
    height: 20,
    speed: 4,
    draw() {
      // draw ship as a green triangle pointing right
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 3;

  // Starfield
  const stars = [];
  const starCount = 100;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
      });
    }
  }
  initStars();

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const yPos = Math.random() * (height - size);
    asteroids.push({ x: width, y: yPos, size });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      // remove off‑screen
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }
  }

  function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.size * 0.3, a.x, a.y, a.size);
      gradient.addColorStop(0, '#bbb');
      gradient.addColorStop(1, '#444');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = (ship.x + ship.width / 2) - a.x;
      const dy = (ship.y + ship.height / 2) - a.y;
      const distance = Math.hypot(dx, dy);
      if (distance < a.size + Math.max(ship.width, ship.height) / 2) {
        return true;
      }
    }
    return false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // reset to allow rapid replay
      thrustSound.currentTime = 0;
      thrustSound.play();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function moveShip() {
    if (keys.ArrowUp) ship.y = Math.max(0, ship.y - ship.speed);
    if (keys.ArrowDown) ship.y = Math.min(height - ship.height, ship.y + ship.speed);
  }

  let gameOver = false;
  function updateStars() {
    // simple parallax: move left, reset to right
    const speed = 1;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
  }
  function loop() {
    if (gameOver) return;
    // fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    updateStars();
    drawStars();
    moveShip();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
    if (checkCollision()) {
      gameOver = true;
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
      return;
    }
    requestAnimationFrame(loop);
  }

  // Start the spawning and the game loop
  const spawnTimer = setInterval(spawnAsteroid, asteroidSpawnInterval);
  requestAnimationFrame(loop);
})();
