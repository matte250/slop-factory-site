// Game based on IDEA.md – Cosmic Courier
// Targets <canvas id="game"></canvas>
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // full‑screen canvas and background
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // create starfield
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
  }));

  // Player ship
  const ship = { x: 50, y: canvas.height / 2, w: 20, h: 10, speed: 3, dx: 0, dy: 0 };
  const keys = {};
  addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids – simple circles moving leftwards
  const asteroids = [];
  function spawnAsteroid() {
    const r = 15 + Math.random() * 15;
    asteroids.push({ x: canvas.width + r, y: Math.random() * canvas.height, r, vx: -2 - Math.random() * 2 });
  }
  // spawn every 1–2 seconds
  setInterval(spawnAsteroid, 1500);

  // Game timer (seconds)
  let timeLeft = 30; // default delivery timer
  const timerInterval = setInterval(() => { if (!gameOver) timeLeft--; }, 1000);

  let gameOver = false;

  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update() {
    if (gameOver) return;
    // Player movement
    ship.dx = ship.dy = 0;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y + ship.dy));

    // Update stars for parallax effect
    stars.forEach(s => {
      s.x -= 0.5; // slow drift left
      if (s.x < 0) s.x = canvas.width;
    });

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      else if (rectCircleCollide(ship, a)) { beep(200, 0.2); gameOver = true; }
    }

    if (timeLeft <= 0) { beep(150, 0.3); gameOver = true; }
  }

  function draw() {
    // dark starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship – triangle pointer
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.lineTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids – shaded circles
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Timer
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${timeLeft}s`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
