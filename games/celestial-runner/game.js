// game.js – Simple endless runner based on IDEA.md
// Target canvas: <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 400;

  // ----- Game objects -----
  const ship = { x: 80, y: HEIGHT / 2, w: 30, h: 20, speedY: 0, maxSpeed: 4 };
  let fuel = 100; // percent, drains each frame
  let score = 0;

  const obstacles = []; // {x, y, r}
  const fuels = []; // {x, y, r, value}

  // starfield for background
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, r: Math.random() * 1.5 + 0.5, speed: 0.5 + Math.random() * 0.5 });
  }

  // ----- Input handling -----
  const keys = { ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- Audio setup -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioUnlocked = false;
  // unlock audio on first interaction
  const unlockAudio = () => {
    if (!audioUnlocked) {
      audioCtx.resume();
      audioUnlocked = true;
    }
  };
  window.addEventListener('keydown', unlockAudio, { once: true });
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function playFuelSound() { playTone(600, 100); }
  function playCrashSound() { playTone(150, 300); }


  // ----- Helper functions -----
  function spawnObstacle() {
    const r = 15 + Math.random() * 15;
    const y = Math.random() * (HEIGHT - 2 * r) + r;
    obstacles.push({ x: WIDTH + r, y, r });
  }
  function spawnFuel() {
    const r = 8;
    const y = Math.random() * (HEIGHT - 2 * r) + r;
    const value = 15 + Math.random() * 10;
    fuels.push({ x: WIDTH + r, y, r, value });
  }

  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > (rect.w / 2 + circle.r)) return false;
    if (distY > (rect.h / 2 + circle.r)) return false;
    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
  }

  // draw the moving starfield background
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = WIDTH;
        s.y = Math.random() * HEIGHT;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----- Game loop -----
  let frames = 0;
  let gameOver = false;
  function update() {
    if (gameOver) return;
    frames++;
    // ship control
    if (keys.ArrowUp) ship.speedY = -ship.maxSpeed;
    else if (keys.ArrowDown) ship.speedY = ship.maxSpeed;
    else ship.speedY = 0;
    ship.y += ship.speedY;
    ship.y = Math.max(0, Math.min(HEIGHT - ship.h, ship.y));

    // fuel consumption
    fuel -= 0.02;
    if (fuel <= 0) fuel = 0;

    // spawn obstacles/fuel
    if (frames % 90 === 0) spawnObstacle(); // every 1.5s @60fps
    if (frames % 300 === 0) spawnFuel(); // every 5s

    // move obstacles/fuel leftwards
    const speed = 3 + frames / 1500; // gradually faster
    obstacles.forEach(o => o.x -= speed);
    fuels.forEach(f => f.x -= speed);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].r < 0) obstacles.shift();
    while (fuels.length && fuels[0].x + fuels[0].r < 0) fuels.shift();

    // collision detection
    for (const o of obstacles) {
      if (rectCircleCollide(ship, o)) { playCrashSound(); gameOver = true; break; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
if (rectCircleCollide(ship, f)) {
          fuel = Math.min(100, fuel + f.value);
          playFuelSound();
          fuels.splice(i, 1);
        }
    }

    // scoring: distance based + fuel collected already accounted
    score = Math.floor(frames / 2);
    if (gameOver) drawGameOver(); else draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // stars
    drawStars();
    // ship as triangle
    ctx.save();
    ctx.translate(ship.x, ship.y + ship.h / 2);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(-ship.w / 2, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // obstacles with radial gradient
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, o.r * 0.3, o.x, o.y, o.r);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#a31111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cells with glowing gradient
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, '#7fff7f');
      grad.addColorStop(1, '#2a8a2a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
  }

  function drawGameOver() {
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '20px sans-serif';
    ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
  }

  // start
  requestAnimationFrame(update);
})();
