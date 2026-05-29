// Simple Canvas Escape game
// Assumes an HTML <canvas id="game"></canvas> element present.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.07,
    update() {
      // rotate handled by key events
      this.x += this.vx;
      this.y += this.vy;
      // screen wrap
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
    },
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-8, -6);
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.restore();
    }
  };

  // ----- Sounds -----
  const thrustAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // simple silent placeholder
  thrustAudio.loop = true;
  const explosionAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // placeholder

// ----- Asteroids -----
  const asteroids = [];
  const asteroidCount = 5;
  function spawnAsteroid() {
    const size = Math.random() * 20 + 15;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    // spawn just outside one edge and move inward
    if (side === 0) { // left
      x = -size; y = Math.random() * height; vx = 1 + Math.random(); vy = (Math.random() - 0.5) * 1.5;
    } else if (side === 1) { // right
      x = width + size; y = Math.random() * height; vx = - (1 + Math.random()); vy = (Math.random() - 0.5) * 1.5;
    } else if (side === 2) { // top
      x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * 1.5; vy = 1 + Math.random();
    } else { // bottom
      x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * 1.5; vy = - (1 + Math.random());
    }
    asteroids.push({x, y, vx, vy, radius: size});
  }
  for (let i = 0; i < asteroidCount; i++) spawnAsteroid();

  // ----- Starfield -----
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Game state -----
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  function update(dt) {
    // ship controls
    if (keys.ArrowLeft) ship.angle -= ship.turnSpeed;
    if (keys.ArrowRight) ship.angle += ship.turnSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // start thrust sound
      if (thrustAudio.paused) thrustAudio.play();
    } else {
      // stop thrust sound when not thrusting
      thrustAudio.pause();
      thrustAudio.currentTime = 0;
    }
    // apply slight friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.update();

    // asteroids movement
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // respawn if off-screen
      if (a.x < -a.radius || a.x > width + a.radius || a.y < -a.radius || a.y > height + a.radius) {
        a.x = Math.random() * width;
        a.y = Math.random() * height;
        a.vx = (Math.random() - 0.5) * 2;
        a.vy = (Math.random() - 0.5) * 2;
        a.radius = Math.random() * 20 + 15;
      }
    }

    // collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        // play explosion sound on collision
        explosionAudio.currentTime = 0;
        explosionAudio.play();
        gameOver = true;
        break;
      }
    }

    score += dt * 0.01; // score grows with time
  }

  function draw() {
    // background gradient (dark space to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // starfield
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship (with stroke for contrast)
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 1.5;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
