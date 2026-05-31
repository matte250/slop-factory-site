// Orbit Escape minimal game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(function () {
  // background stars
  const starCount = 80;
  const stars = [];
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust() { playSound(400, 0.07); }
  function playExplosion() { playSound(100, 0.3); }
  function playWin() { playSound(800, 0.4); }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  const center = { x: width / 2, y: height / 2 };
  // initialize stars after dimensions are known
  initStars();

  // Ship state
  let angle = 0; // radians
  let radius = Math.min(width, height) * 0.2; // start distance from center
  const shipRadius = 8;
  const angularSpeed = 0.02; // rad/frame
  const thrust = 2; // radius increase per click
  const gravity = 0.5; // radius decrease per frame
  const minRadius = shipRadius + 5;
  const maxRadius = Math.min(width, height) / 2 - shipRadius;

  // Asteroids
  const asteroids = [];
  const asteroidCount = 5;
  const asteroidMinRadius = 10;
  const asteroidMaxRadius = 20;
  const asteroidSpeed = 1.5;

  function initAsteroids() {
    for (let i = 0; i < asteroidCount; i++) {
      const r = Math.random() * (asteroidMaxRadius - asteroidMinRadius) + asteroidMinRadius;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (maxRadius - minRadius) + minRadius;
      const x = center.x + Math.cos(angle) * dist;
      const y = center.y + Math.sin(angle) * dist;
      const dir = Math.random() < 0.5 ? -1 : 1; // left/right
      asteroids.push({ x, y, r, dir });
    }
  }

  function updateAsteroids() {
    for (const a of asteroids) {
      a.x += a.dir * asteroidSpeed;
      // wrap around horizontally
      if (a.x < -a.r) a.x = width + a.r;
      if (a.x > width + a.r) a.x = -a.r;
    }
  }

  function drawBackground() {
    // dark space gradient
    const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, Math.max(width, height) / 2);
    grad.addColorStop(0, '#02010a');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

function drawAsteroids() {
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShip() {
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, shipRadius, 0, Math.PI * 2);
    ctx.fill();
    // optional thrust visual
  }

  function checkCollision() {
    const shipX = center.x + Math.cos(angle) * radius;
    const shipY = center.y + Math.sin(angle) * radius;
    for (const a of asteroids) {
      const dx = shipX - a.x;
      const dy = shipY - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < shipRadius + a.r) return true;
    }
    return false;
  }

  let gameOver = false;
  let win = false;
  let lossReason = '';

  function loop() {
    if (gameOver) return;
    // draw background (gradient + stars)
    drawBackground();

    // Update ship physics
    radius -= gravity;
    if (radius < minRadius) { gameOver = true; lossReason = 'crash'; playExplosion(); }
    if (radius > maxRadius) { win = true; gameOver = true; playWin(); }
    angle += angularSpeed;

    updateAsteroids();
    drawAsteroids();
    drawShip();

    if (checkCollision()) { gameOver = true; }

    if (!gameOver) {
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText(win ? 'You Escaped!' : 'Game Over', width / 2, height / 2);
    }
  }

  canvas.addEventListener('click', () => {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    radius += thrust;
    if (radius > maxRadius) radius = maxRadius;
    playThrust();
  });

  initAsteroids();
  requestAnimationFrame(loop);
})();
