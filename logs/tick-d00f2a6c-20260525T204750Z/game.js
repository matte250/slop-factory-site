// Cosmic Dodger – enhanced graphics version
// Assumes an HTML <canvas id="game"></canvas> present in the page

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, length) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + length);
  }
  function playCollision() { playTone(150, 0.2); }
  function playBoost() { playTone(400, 0.07); }
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
  };
  resize();
  addEventListener('resize', resize);

  // ----- Player -----
  const ship = {
    x: 80,
    y: innerHeight / 2,
    radius: 12,
    angle: 0, // radians, 0 points right
    speed: 0,
    maxSpeed: 4,
    boost: 0.1,
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
  addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // resume audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- Asteroids -----
  const stars = [];
  const starSpawnRate = 5; // frames
  function spawnStar() {
    stars.push({
      x: innerWidth,
      y: Math.random() * innerHeight,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frameCount = 0;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    asteroids.push({
      x: innerWidth + size,
      y: Math.random() * innerHeight,
      r: size,
      speed: Math.random() * 2 + 2,
    });
  }

  // ----- Game state -----
  let shield = 3;
  let score = 0;
  let gameOver = false;

  function drawShip() {
    // ship with gradient fill and subtle glow
    const gradient = ctx.createLinearGradient(-ship.radius, -ship.radius, ship.radius, ship.radius);
    gradient.addColorStop(0, '#0ff');
    gradient.addColorStop(1, '#00f');
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    const { x, y, angle, radius } = ship;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-radius, -radius / 2);
    ctx.lineTo(-radius, radius / 2);
    ctx.lineTo(radius, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

function drawAsteroid(a) {
    // asteroid with radial gradient and subtle glow
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }
    // asteroid with radial gradient and subtle glow
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }

  function drawHUD() {
    // simple dark background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, innerHeight);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // shield indicator as rectangles
    for (let i = 0; i < shield; i++) {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(10 + i * 22, 30, 20, 10);
    }
  }

  function checkCollision(a) {
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + ship.radius;
  }

  function update() {
    if (gameOver) return;
    let moved = false;
    if (keys.ArrowUp || keys.w) { ship.y -= ship.maxSpeed; moved = true; }
    if (keys.ArrowDown || keys.s) { ship.y += ship.maxSpeed; moved = true; }
    if (keys.ArrowLeft || keys.a) { ship.x -= ship.maxSpeed; moved = true; }
    if (keys.ArrowRight || keys.d) { ship.x += ship.maxSpeed; moved = true; }
    if (moved) playBoost();
    // keep within bounds
    ship.y = Math.max(ship.radius, Math.min(innerHeight - ship.radius, ship.y));
    ship.x = Math.max(ship.radius, Math.min(innerWidth - ship.radius, ship.x));
    // angle towards mouse (optional) – omitted for brevity

    // spawn asteroids
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
    // spawn stars
    if (frameCount % starSpawnRate === 0) spawnStar();
    frameCount++;

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      else if (checkCollision(a)) {
        asteroids.splice(i, 1);
        shield--;
        playCollision();
        if (shield <= 0) {
          gameOver = true;
        }
      }
    }

    // move stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) stars.splice(i, 1);
    }

    score += 0.05; // distance based score
  }
    if (gameOver) return;
    // handle input
    if (keys.ArrowUp || keys.w) ship.y -= ship.maxSpeed;
    if (keys.ArrowDown || keys.s) ship.y += ship.maxSpeed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.maxSpeed;
    if (keys.ArrowRight || keys.d) ship.x += ship.maxSpeed;
    // keep within bounds
    ship.y = Math.max(ship.radius, Math.min(innerHeight - ship.radius, ship.y));
    ship.x = Math.max(ship.radius, Math.min(innerWidth - ship.radius, ship.x));
    // angle towards mouse (optional) – omitted for brevity

    // spawn asteroids
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
    frameCount++;

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      else if (checkCollision(a)) {
        asteroids.splice(i, 1);
        shield--;
        if (shield <= 0) {
          gameOver = true;
        }
      }
    }

    score += 0.05; // distance based score
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawShip();
    asteroids.forEach(drawAsteroid);
    drawHUD();
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', innerWidth / 2, innerHeight / 2);
    }
  }

  function loop() {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
