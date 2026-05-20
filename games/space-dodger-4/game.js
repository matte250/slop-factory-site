// Space Dodger – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size (fixed for simplicity)
  canvas.width = 800;
  canvas.height = 600;

  // Create starfield
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function updateStars(dt) {
    stars.forEach(s => {
      s.y += s.speed * dt * 0.5;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
  }
  canvas.width = 800;
  canvas.height = 600;

  const ship = {
    w: 40,
    h: 20,
    x: 400,
    y: canvas.height - 30,
    speed: 6,
  };

  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  class Asteroid {
    constructor() {
      this.r = Math.random() * 20 + 10;
      this.x = Math.random() * (canvas.width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = Math.random() * 2 + 2 + difficulty * 0.5;
    }
    update(dt) { this.y += this.speed * dt; }
    draw() {
      const grad = ctx.createRadialGradient(
        this.x, this.y, this.r * 0.1,
        this.x, this.y, this.r
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let asteroids = [];
  let lastSpawn = 0;
  let spawnInterval = 1500; // ms
  let difficulty = 0;
  let score = 0;
  let lastTime = performance.now();
  let running = true;

  function reset() {
    asteroids = [];
    lastSpawn = 0;
    spawnInterval = 1500;
    difficulty = 0;
    score = 0;
    ship.x = canvas.width / 2;
    running = true;
    document.getElementById('restartBtn')?.remove();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Game Over – Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2);
    const btn = document.createElement('button');
    btn.id = 'restartBtn';
    btn.textContent = 'Restart';
    btn.style.position = 'absolute';
    btn.style.left = `${canvas.offsetLeft + canvas.width / 2 - 50}px`;
    btn.style.top = `${canvas.offsetTop + canvas.height / 2 + 30}px`;
    btn.onclick = reset;
    document.body.appendChild(btn);
  }

  function collide(asteroid) {
    const shipRect = { x: ship.x - ship.w / 2, y: ship.y - ship.h / 2, w: ship.w, h: ship.h };
    const dx = Math.max(shipRect.x, Math.min(asteroid.x, shipRect.x + shipRect.w));
    const dy = Math.max(shipRect.y, Math.min(asteroid.y, shipRect.y + shipRect.h));
    const dist = Math.hypot(asteroid.x - dx, asteroid.y - dy);
    return dist < asteroid.r;
  }

function loop(now) {
    const dt = (now - lastTime) / 16; // normalize roughly to 60fps steps
    lastTime = now;
    if (!running) return;

    // Update background stars
    updateStars(dt);

    // Draw background: starfield gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Draw stars
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Update ship
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(canvas.width - ship.w / 2, ship.x));

    // Draw ship (simple triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();

    // Spawn asteroids
    if (now - lastSpawn > spawnInterval) {
      asteroids.push(new Asteroid());
      lastSpawn = now;
      // increase difficulty
      difficulty += 0.1;
      spawnInterval = Math.max(300, spawnInterval * 0.98);
    }

    // Update and draw asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update(dt);
      a.draw();
      if (a.y - a.r > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      if (collide(a)) {
        gameOver();
        return;
      }
    }

    // Score
    score += dt * 0.01;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
