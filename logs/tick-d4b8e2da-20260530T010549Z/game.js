// game.js – Simple Asteroid Dodge game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Load sounds
  const bgMusic = new Audio('bgm.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play().catch(()=>{}); // ignore autoplay block

  const thrustSound = new Audio('thrust.wav');
  thrustSound.loop = true;
  thrustSound.volume = 0.5;

  const explosionSound = new Audio('explosion.wav');
  explosionSound.volume = 0.7;

  // Resize canvas to fill parent
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // generate starfield once per resize
    stars = [];
    const starCount = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  };
  resize();
  window.addEventListener('resize', resize);

  // starfield array
  let stars = [];

  // ----- Player ship -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: 2.5,
    vx: 0,
    vy: 0,
  };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  const updateShip = () => {
    const movingLeft = keys['arrowleft'] || keys['a'];
    const movingRight = keys['arrowright'] || keys['d'];
    const movingUp = keys['arrowup'] || keys['w'];
    const movingDown = keys['arrowdown'] || keys['s'];

    if (movingLeft) ship.vx = -ship.speed;
    else if (movingRight) ship.vx = ship.speed;
    else ship.vx = 0;

    if (movingUp) ship.vy = -ship.speed;
    else if (movingDown) ship.vy = ship.speed;
    else ship.vy = 0;

    // Thrust sound control
    if (ship.vx !== 0 || ship.vy !== 0) {
      if (thrustSound.paused) thrustSound.play().catch(()=>{});
    } else {
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }

    ship.x = Math.max(ship.size, Math.min(canvas.width - ship.size, ship.x + ship.vx));
    ship.y = Math.max(ship.size, Math.min(canvas.height - ship.size, ship.y + ship.vy));
  };

  const drawShip = () => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // glowing gradient ship
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, ship.size);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#004400');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // draw starfield
  const drawStars = () => {
    ctx.save();
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  const createAsteroid = () => {
    const side = Math.floor(Math.random() * 4);
    const radius = 10 + Math.random() * 20;
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    switch (side) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -radius;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // right
        x = canvas.width + radius;
        y = Math.random() * canvas.height;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + radius;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      case 3: // left
        x = -radius;
        y = Math.random() * canvas.height;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.02;
    asteroids.push({ x, y, vx, vy, radius, angle, angularSpeed });
  };

  const updateAsteroids = (dt) => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle += a.angularSpeed * dt;
      // Remove if far off‑screen
      if (a.x < -a.radius * 2 || a.x > canvas.width + a.radius * 2 ||
          a.y < -a.radius * 2 || a.y > canvas.height + a.radius * 2) {
        asteroids.splice(i, 1);
      }
    }
  };

  const drawAsteroid = (a) => {
    const sides = 5 + Math.floor(Math.random() * 3); // 5‑7 sides
    const step = (Math.PI * 2) / sides;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    // gradient fill for glowing effect
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, a.radius);
    grad.addColorStop(0, '#ff8800');
    grad.addColorStop(1, '#550000');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const rad = a.radius * (0.7 + Math.random() * 0.3);
      const sx = Math.cos(i * step) * rad;
      const sy = Math.sin(i * step) * rad;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // ----- Collision -----
  const checkCollision = () => {
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size + a.radius) return true;
    }
    return false;
  };

  // ----- Game loop -----
  let startTime = null;
  let lastTime = 0;
  let gameOver = false;
  let explosionPlayed = false;

  const loop = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Score: ${Math.floor((timestamp - startTime) / 1000)}s`, canvas.width / 2, canvas.height / 2 + 30);
      return;
    }

    // spawn asteroids
    if (timestamp - lastSpawn > asteroidSpawnInterval) {
      createAsteroid();
      lastSpawn = timestamp;
    }

    updateShip();
    updateAsteroids(dt);
    if (checkCollision()) {
      gameOver = true;
      if (!explosionPlayed) {
        explosionSound.play().catch(()=>{});
        explosionPlayed = true;
        bgMusic.pause();
      }
    }

    // draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    drawStars();
    // draw ship and asteroids
    drawShip();
    for (const a of asteroids) drawAsteroid(a);
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    const seconds = Math.floor((timestamp - startTime) / 1000);
    ctx.fillText(`Score: ${seconds}s`, 10, 20);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
