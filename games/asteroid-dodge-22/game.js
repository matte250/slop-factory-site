// Asteroid Dodge – minimal implementation targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  function playBoost() { playTone(800, 100); }
  function playExplosion() { playTone(150, 400); }
  // Ensure audio context resumes on first interaction
  window.addEventListener('click', () => { audioCtx.resume(); }, {once:true});
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);

  // Ship
  const ship = {
    x: W / 2,
    y: H - 60,
    r: 15,
    speedX: 0,
    maxSpeed: 5,
    boostTimer: 0,
  };
  // Score
  let score = 0;

  // Asteroids
  const asteroids = [];
  let frames = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    asteroids.push({
      x: Math.random() * (W - 2 * radius) + radius,
      y: -radius,
      r: radius,
      speedY: 2 + Math.random() * 2,
    });
  }

  function update() {
    if (gameOver) return;
    // Ship horizontal movement
    if (keys['ArrowLeft']) ship.speedX = -ship.maxSpeed;
    else if (keys['ArrowRight']) ship.speedX = ship.maxSpeed;
    else ship.speedX = 0;
    ship.x += ship.speedX;
    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x));

    // Boost (Space) – temporarily increase scroll speed
    if (keys['Space'] && ship.boostTimer === 0) { ship.boostTimer = 60; playBoost(); }
    if (ship.boostTimer > 0) ship.boostTimer--;
    const scrollSpeed = ship.boostTimer > 0 ? 4 : 2;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speedY + scrollSpeed; // move downwards
      // Remove off‑screen
      if (a.y - a.r > H) asteroids.splice(i, 1);
      // Collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.r + ship.r) ** 2) {
        gameOver = true;
        playExplosion();
      }
    }

    // Spawn new asteroids
    if (frames % 30 === 0) spawnAsteroid();
    frames++;
    // Increment score based on distance travelled
    score += scrollSpeed;
  }

  function draw() {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001024');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Simple star field
    if (!window._stars) {
      window._stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2 + 0.5,
        speed: 0.5 + Math.random() * 1.0,
      }));
    }
    ctx.fillStyle = 'white';
    window._stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // cleared by background fill
    // Ship – simple triangle with gradient fill
    const shipGrad = ctx.createLinearGradient(ship.x - ship.r, ship.y - ship.r, ship.x + ship.r, ship.y + ship.r);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // Asteroids – gradient fill
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score display
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'red';
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

  // Start
  requestAnimationFrame(loop);
})();
