// game.js – Cosmic Dodger
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth);
  const H = (canvas.height = canvas.clientHeight);

  // create a vertical dark gradient background for depth
  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#000');

  // ship
  const ship = { x: 80, y: H / 2, size: 20, vy: 0 };
  const GRAVITY = 0.4;
  const THRUST = -8;

  // asteroids
  const asteroids = [];
  const AST_SPEED = 3;
  const SPAWN_RATE = 90; // frames

  // stars background
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    s: Math.random() * 0.5 + 0.2,
  }));

  let frame = 0;
  let score = 0;
  let running = true;

  // audio setup
  let audioCtx;
  const initAudio = () => { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } };
  const playSound = (freq, dur) => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  };
  // input – press/tap anywhere on canvas
  const onPress = (e) => { e.preventDefault(); ship.vy = THRUST; playSound(300, 0.1); };
  canvas.addEventListener('mousedown', onPress);
  canvas.addEventListener('touchstart', onPress);

  function drawStar(s) {
    // twinkling star using radial gradient
    const starGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2);
    starGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    starGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = starGrad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 2, 0, Math.PI * 2);
    ctx.fill();
    s.x -= s.s;
    if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
  }

  function drawShip() {
    // ship with a subtle gradient for depth
    const shipGrad = ctx.createLinearGradient(ship.x - ship.size, ship.y - ship.size, ship.x, ship.y + ship.size);
    shipGrad.addColorStop(0, '#4f4');
    shipGrad.addColorStop(1, '#0a0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y - ship.size);
    ctx.closePath();
    ctx.fill();
    // outline for contrast
    ctx.strokeStyle = '#2f2';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({ x: W + size, y: Math.random() * (H - size * 2) + size, r: size });
  }

  function drawAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= AST_SPEED;
      // radial gradient for glowing asteroid
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff7');
      grad.addColorStop(1, '#c33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      // collision detection
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size / 2) { running = false; playSound(120, 0.3); }
      // remove off‑screen and increase score
      if (a.x + a.r < 0) { asteroids.splice(i, 1); score++; }
    }
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = '#0008';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Final Score: ${score}`, W / 2 - 60, H / 2 + 30);
      return;
    }
    // clear canvas with gradient background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);
    // draw stars with parallax layers (already handled)

    stars.forEach(drawStar);
    // ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    if (ship.y > H - ship.size) ship.y = H - ship.size;
    if (ship.y < ship.size) ship.y = ship.size;
    drawShip();
    drawAsteroids();
    drawScore();
    // spawn new asteroids
    if (frame % SPAWN_RATE === 0) spawnAsteroid();
    frame++;
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();