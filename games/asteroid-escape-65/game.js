// Simple Asteroid Escape game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition (triangle)
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 40,
    h: 20,
    speed: 5,
    color: '#0f0',
    dx: 0,
    dy: 0,
    update() {
      this.x = Math.max(0, Math.min(width - this.w, this.x + this.dx));
      this.y = Math.max(0, Math.min(height - this.h, this.y + this.dy));
    },
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroid pool and starfield
  const asteroids = [];
  const asteroidFreq = 90; // frames between spawns
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5
    });
  }
  let frame = 0;
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
      color: '#a00'
    });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) asteroids.splice(i, 1);
    }
  }

function updateStars() {
  stars.forEach(s => {
    s.y += 0.3; // slight downward drift
    if (s.y > height) s.y = 0;
  });
}
function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}
// Enhanced asteroid drawing with rotation
function drawAsteroids() {
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
    grad.addColorStop(0, '#ff5555');
    grad.addColorStop(1, '#880000');
    ctx.fillStyle = grad;
    ctx.save();
    ctx.translate(a.x + a.w/2, a.y + a.h/2);
    a.angle = (a.angle || 0) + 0.02;
    ctx.rotate(a.angle);
    ctx.beginPath();
    ctx.arc(0, 0, a.w/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}


  function checkCollision() {
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w && ship.x + ship.w > a.x &&
        ship.y < a.y + a.h && ship.y + ship.h > a.y
      ) {
        return true;
      }
    }
    return false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
  }

  // Main loop
  let gameOver = false;
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#ff5555');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      return;
    }
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0,0,width, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    drawStars();
    handleInput();
    ship.update();
    ship.draw();
    if (frame++ % asteroidFreq === 0) spawnAsteroid();
    updateAsteroids();
    drawAsteroids();
    if (checkCollision()) gameOver = true;
    requestAnimationFrame(loop);
  }

  // Start the game after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
