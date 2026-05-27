// Simple space asteroid escape game targeting <canvas id="game"></canvas>
// Ship at bottom moves left/right (A/D or Arrow keys) and shoots upward (Space).
// Asteroids fall with random size, speed, rotation. Collision ends the game.

(() => {
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playShoot() { playTone(800, 0.05); }
  function playExplosion() { playTone(200, 0.2); }
  function playGameOver() { playTone(100, 0.5); }

  // ----- Starfield background -----
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ----- Starfield background -----
  const starCount = 150;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // ----- Game objects -----
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0f0',
  };

  const bullets = [];
  const asteroids = [];
  let gameOver = false;
  let lastAsteroidTime = 0;
  const asteroidInterval = 800; // ms

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20; // 20-50px
    const speed = Math.random() * 1.5 + 0.5; // 0.5-2.0 px/frame
    const rotation = Math.random() * 0.1 - 0.05; // -0.05..0.05 rad/frame
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, size, speed, angle: 0, rotation });
  }

  function shoot() {
    bullets.push({ x: ship.x + ship.width / 2, y: ship.y, speed: 7 });
    playShoot();
  }

  function update(dt) {
    // ship movement
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // shooting (space)
    if (keys[' '] && !keys['_spaceLocked']) {
      shoot();
      keys['_spaceLocked'] = true; // simple debounce
    }
    if (!keys[' ']) keys['_spaceLocked'] = false;

    // update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y < 0) bullets.splice(i, 1);
    }

    // spawn asteroids
    if (Date.now() - lastAsteroidTime > asteroidInterval) {
      spawnAsteroid();
      lastAsteroidTime = Date.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.rotation;
      // check collision with ship (circle-rect approx)
      const distX = Math.max(ship.x, Math.min(a.x + a.size / 2, ship.x + ship.width));
      const distY = Math.max(ship.y, Math.min(a.y + a.size / 2, ship.y + ship.height));
      const dx = a.x + a.size / 2 - distX;
      const dy = a.y + a.size / 2 - distY;
if (dx * dx + dy * dy < (a.size / 2) * (a.size / 2)) {
          if (!gameOver) {
            gameOver = true;
            playGameOver();
          }
        }
      // bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const bx = b.x;
        const by = b.y;
        const ax = a.x + a.size / 2;
        const ay = a.y + a.size / 2;
        const dist = Math.hypot(bx - ax, by - ay);
        if (dist < a.size / 2) {
          playExplosion();
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          break;
        }
      }
      // remove if off screen
      if (a.y - a.size > height) {
        // asteroid reached bottom -> lose condition
        gameOver = true;
        asteroids.splice(i, 1);
      }
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#000022');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship (triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids with radial gradient
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.angle);
      const radGrad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size / 2);
      radGrad.addColorStop(0, '#555');
      radGrad.addColorStop(1, '#222');
      ctx.fillStyle = radGrad;
      ctx.fillRect(-a.size / 2, -a.size / 2, a.size, a.size);
      ctx.restore();
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
