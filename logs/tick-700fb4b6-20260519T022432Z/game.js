// Simple side‑scrolling Space Junk Collector game with enhanced graphics
// Canvas with id="game" is expected in the HTML.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  // generate background stars
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 0.5,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playCollect = () => playTone(800, 0.1);
  const playHit = () => playTone(200, 0.2);
  const playWin = () => playTone(1200, 0.3);
  const playLose = () => playTone(150, 0.5);

  // game state additions
  let endReason = null; // 'win' or 'lose'
  let endSoundPlayed = false;

  // Game objects
  const ship = { x: 80, y: H / 2, w: 30, h: 15, vy: 0, shield: 3 };
  const debris = [];
  const asteroids = [];
  let score = 0;
  const targetScore = 20;
  let gameOver = false;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawn() {
    // debris: small blue circles
    if (Math.random() < 0.04) {
      debris.push({ x: W, y: Math.random() * H, r: 6, vx: -2 });
    }
    // asteroids: larger red circles
    if (Math.random() < 0.01) {
      asteroids.push({ x: W, y: Math.random() * H, r: 14, vx: -3 });
    }
  }

  function update() {
    // update background stars
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
    });
    if (gameOver) return;
    // ship control – vertical only (ArrowUp/Down or W/S)
    if (keys['ArrowUp'] || keys['KeyW']) ship.vy = -3;
    else if (keys['ArrowDown'] || keys['KeyS']) ship.vy = 3;
    else ship.vy = 0;
    ship.y += ship.vy;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // move objects
    debris.forEach(d => d.x += d.vx);
    asteroids.forEach(a => a.x += a.vx);

    // remove off‑screen
    while (debris.length && debris[0].x < -20) debris.shift();
    while (asteroids.length && asteroids[0].x < -20) asteroids.shift();

    // collisions
    debris.forEach((d, i) => {
      if (d.x < ship.x + ship.w && d.x > ship.x &&
          d.y > ship.y && d.y < ship.y + ship.h) {
        score++;
        playCollect();
        debris.splice(i, 1);
      }
    });
    asteroids.forEach((a, i) => {
      const dx = a.x - (ship.x + ship.w / 2);
      const dy = a.y - (ship.y + ship.h / 2);
      const dist = Math.hypot(dx, dy);
if (dist < a.r + Math.max(ship.w, ship.h) / 2) {
        ship.shield--;
        playHit();
        asteroids.splice(i, 1);
        if (ship.shield <= 0) { gameOver = true; endReason = 'lose'; }
        }

    });

    if (score >= targetScore) { gameOver = true; endReason = 'win'; }
    spawn();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // ship – draw as a triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // shield indicator
    ctx.fillStyle = '#ff0';
    for (let i = 0; i < ship.shield; i++) {
      ctx.fillRect(10 + i * 12, 10, 10, 5);
    }
    // background stars
    ctx.fillStyle = '#222';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // debris
    ctx.fillStyle = '#88f';
    debris.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids
    ctx.fillStyle = '#f44';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, W - 100, 20);
    // game over / win
    if (gameOver) {
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      const msg = score >= targetScore ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, W / 2 - 50, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
});
