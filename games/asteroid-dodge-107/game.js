// Simple Asteroid Dodge game targeting canvas with id "game"
// Ship (triangle) controlled by arrow keys. Asteroids fall from top.
// Improved graphics: background stars, gradients, shadows.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // generate subtle background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // draw background gradient (dark space to lighter near bottom)
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#000014');
    grad.addColorStop(1, '#001040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    drawStars();
  }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 30,
    size: 15,
    speed: 4,
    dx: 0,
    dy: 0,
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside bounds
      this.x = Math.max(this.size, Math.min(width - this.size, this.x));
      this.y = Math.max(this.size, Math.min(height - this.size, this.y));
    },
    draw() {
      // ship with gradient and slight glow
      const grad = ctx.createLinearGradient(this.x, this.y - this.size, this.x, this.y + this.size);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0,255,255,0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  // Asteroid pool
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 60; // frames

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function handleInput() {
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
  }

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size * 2) + size;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, size, speed });
    // play a short beep when an asteroid appears
    playBeep(300, 0.05);
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove if off screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#ff8800');
      grad.addColorStop(1, '#442200');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,140,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.size) {
        // play collision sound
        playBeep(100, 0.3);
        return true;
      }
    }
    return false;
  }

  let score = 0;
  let gameOver = false;

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
      return;
    }
    // draw background with gradient and stars
    drawBackground();
    handleInput();
    ship.update();
    ship.draw();
    if (spawnTimer <= 0) { spawnAsteroid(); spawnTimer = spawnInterval; }
    else spawnTimer--;
    updateAsteroids();
    drawAsteroids();
    if (checkCollision()) gameOver = true;
    score++;
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
