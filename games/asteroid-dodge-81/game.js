// Minimalist asteroid dodge game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Create a simple starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random()
    });
  }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    speed: 2,
    vx: 0,
    vy: 0,
    move() {
      this.x = (this.x + this.vx + width) % width;
      this.y = (this.y + this.vy + height) % height;
    },
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  // Asteroid pool
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 2000; // ms
  let speedMultiplier = 1;
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  const spawnAsteroid = () => {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 8 + Math.random() * 12;
    const baseSpeed = 1 + Math.random();
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -size;
        vx = (Math.random() - 0.5) * baseSpeed;
        vy = baseSpeed;
        break;
      case 1: // right
        x = width + size;
        y = Math.random() * height;
        vx = -baseSpeed;
        vy = (Math.random() - 0.5) * baseSpeed;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + size;
        vx = (Math.random() - 0.5) * baseSpeed;
        vy = -baseSpeed;
        break;
      case 3: // left
        x = -size;
        y = Math.random() * height;
        vx = baseSpeed;
        vy = (Math.random() - 0.5) * baseSpeed;
        break;
    }
    asteroids.push({ x, y, vx: vx * speedMultiplier, vy: vy * speedMultiplier, radius: size });
  };

  const update = (delta) => {
    if (gameOver) return;
    // Update ship
    ship.move();
    // Update asteroids
    asteroids.forEach(a => {
      a.x += a.vx * delta / 16;
      a.y += a.vy * delta / 16;
    });
    // Remove off-screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.radius || a.x > width + a.radius || a.y < -a.radius || a.y > height + a.radius) {
        asteroids.splice(i, 1);
        score++;
      }
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        playCollision();
        gameOver = true;
        break;
      }
    }
    // Spawn logic
    asteroidTimer += delta;
    if (asteroidTimer > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
      // increase difficulty gradually
      speedMultiplier += 0.02;
      asteroidInterval = Math.max(400, asteroidInterval - 20);
    }
  };

  const draw = () => {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fill();
    });

    // Ship with glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.5)';
    ctx.shadowBlur = 10;
    ship.draw();
    ctx.restore();

    // Asteroids with radial gradient
    ctx.fillStyle = '#a55';
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#d99');
      grad.addColorStop(1, '#a33');
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = (timestamp) => {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(300, 100); }
  function playCollision() { playTone(100, 500); }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; updateShipVelocity(); playThrust(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; updateShipVelocity(); });
  function updateShipVelocity() {
    ship.vx = 0; ship.vy = 0;
    if (keys.ArrowLeft || keys.a) ship.vx = -ship.speed;
    if (keys.ArrowRight || keys.d) ship.vx = ship.speed;
    if (keys.ArrowUp || keys.w) ship.vy = -ship.speed;
    if (keys.ArrowDown || keys.s) ship.vy = ship.speed;
  }

  // Start
  requestAnimationFrame(loop);
})();
