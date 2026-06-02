// Asteroid Dodge – enhanced graphics with sound effects
// Targets canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // ----- Audio -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playThrust() { playTone(200, 0.05, 'square'); }
  function playExplosion() { playTone(100, 0.3, 'sawtooth'); }

  const W = (canvas.width = canvas.clientWidth || 400);
  const H = (canvas.height = canvas.clientHeight || 600);

  // ----- Starfield -----
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + 0.5 });
  }
  function updateStars() {
    for (const s of stars) {
      s.y += 0.5; // move down slowly
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  // ----- Ship -----
  const ship = { x: W / 2, y: H - 50, w: 30, h: 40, speed: 4 };
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // thrust particles
  const thrust = [];
  function spawnThrust() {
    thrust.push({
      x: ship.x + ship.w / 2,
      y: ship.y + ship.h,
      vy: 2 + Math.random() * 2,
      life: 20,
    });
  }
  function updateThrust() {
    for (let i = thrust.length - 1; i >= 0; i--) {
      const p = thrust[i];
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) thrust.splice(i, 1);
    }
  }
  function drawThrust() {
    ctx.fillStyle = 'rgba(255,200,0,0.6)';
    for (const p of thrust) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ----- Asteroids -----
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (W - size),
      y: -size,
      r: size / 2,
      speed: 2 + Math.random() * 3,
    });
  }

  function update() {
    if (gameOver) return;
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // thrust effect when moving up
    if (keys.ArrowUp) { spawnThrust(); playThrust(); }

    // update particles and stars
    updateThrust();
    updateStars();

    // spawn asteroids
    if (spawnTimer-- <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    }
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > H) {
        asteroids.splice(i, 1);
        score++;
      } else if (circleRectCollision(a, ship)) {
        playExplosion();
        gameOver = true;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    drawStars();
    drawThrust();

    // ship – gradient triangle
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // asteroids – radial gradient for 3D look
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.2, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#ccc');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // simple circle‑rect collision
  function circleRectCollision(c, r) {
    const distX = Math.abs(c.x + c.r - (r.x + r.w / 2));
    const distY = Math.abs(c.y + c.r - (r.y + r.h / 2));
    if (distX > r.w / 2 + c.r) return false;
    if (distY > r.h / 2 + c.r) return false;
    if (distX <= r.w / 2) return true;
    if (distY <= r.h / 2) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  // start the loop
  requestAnimationFrame(loop);
})();
