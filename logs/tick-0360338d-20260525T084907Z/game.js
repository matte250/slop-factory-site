// Minimal side‑scroll runner – Wind Runner
// Enhanced graphics: gradient plane, rounded obstacles, background clouds, tilt on movement
// The HTML contains: <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 400;
  const GRAVITY = 0.4;
  const BOOST = -8;
  const SCROLL_SPEED = 3;
  const OBSTACLE_GAP = 150; // distance between obstacles
  const GUST_CHANCE = 0.01; // per frame
  // Audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  function playBoost() { playTone(600, 0.1); }
  function playCollect() { playTone(800, 0.08); }
  function playCrash() { playTone(200, 0.3); }

  class Plane {
  // Draws the plane with a gradient fill and slight tilt based on vertical velocity
    constructor() {
      this.x = 80;
      this.y = HEIGHT / 2;
      this.vy = 0;
      this.width = 30;
      this.height = 20;
    }
    boost() { this.vy = BOOST; }
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;
      if (this.y < 0) this.y = 0;
    }
  draw() {
    // Save context and apply tilt based on vertical velocity
    ctx.save();
    const centerX = this.x - this.width / 4; // pivot slightly behind nose
    const centerY = this.y + this.height / 2;
    const tilt = Math.atan2(this.vy, 5); // small tilt factor
    ctx.translate(centerX, centerY);
    ctx.rotate(tilt);
    // Gradient fill for plane body
    const grad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
    grad.addColorStop(0, '#ffdd00');
    grad.addColorStop(1, '#ffaa00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(-this.width / 2, this.height);
    ctx.lineTo(-this.width / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  }

  class Obstacle {
  // Draws obstacle as rounded rectangle with gradient
    constructor(x) {
      this.x = x;
      // gap position
      this.gapY = Math.random() * (HEIGHT - 120) + 60;
      this.width = 40;
      this.passed = false;
    }
    update() { this.x -= SCROLL_SPEED; }
  draw() {
    // Gradient for obstacle
    const grad = ctx.createLinearGradient(this.x, 0, this.x, HEIGHT);
    grad.addColorStop(0, '#555');
    grad.addColorStop(1, '#777');
    ctx.fillStyle = grad;
    // Draw top rounded block
    this._drawRoundedRect(this.x, 0, this.width, this.gapY - 40, 10);
    // Draw bottom rounded block
    this._drawRoundedRect(this.x, this.gapY + 40, this.width, HEIGHT - (this.gapY + 40), 10);
  }
  // Helper to draw rounded rectangle
  _drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }
    collides(plane) {
      const inX = plane.x < this.x + this.width && plane.x + plane.width > this.x;
      const inYTop = plane.y < this.gapY - 40;
      const inYBottom = plane.y + plane.height > this.gapY + 40;
      return inX && (inYTop || inYBottom);
    }
  }

  class Gust {
    constructor(x) {
      this.x = x;
      this.y = Math.random() * (HEIGHT - 30) + 15;
      this.radius = 10;
    }
    update() { this.x -= SCROLL_SPEED; }
    draw() {
      // Simple radial gradient for gust
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, '#aaddff');
      grad.addColorStop(1, '#0077bb');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    collect(plane) {
      const dx = plane.x + plane.width / 2 - this.x;
      const dy = plane.y + plane.height / 2 - this.y;
      return Math.hypot(dx, dy) < this.radius + Math.max(plane.width, plane.height) / 2;
    }
  }

  // Background cloud class for parallax effect
  class Cloud {
    constructor(x) {
      this.x = x;
      this.y = Math.random() * (HEIGHT * 0.5);
      this.width = 60 + Math.random() * 40;
      this.height = 30 + Math.random() * 20;
      this.speed = SCROLL_SPEED * 0.5;
    }
    update() { this.x -= this.speed; }
    draw() {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }


  let plane = new Plane();
  let clouds = []; // background clouds
  let obstacles = [];
  let gusts = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const lastX = obstacles.length ? obstacles[obstacles.length - 1].x : WIDTH;
    obstacles.push(new Obstacle(lastX + OBSTACLE_GAP));
  }

  function spawnGust() {
    gusts.push(new Gust(WIDTH + Math.random() * 200));
  }

  function spawnCloud() {
    // spawn cloud slightly off-screen to the right
    clouds.push(new Cloud(WIDTH + Math.random() * 200));
  }

  function reset() {
    // reset clouds
    clouds = [];
    // initial cloud spawn
    spawnCloud();
    plane = new Plane();
    obstacles = [];
    gusts = [];
    frame = 0;
    score = 0;
    gameOver = false;
    spawnObstacle();
  }

  function update() {
    if (gameOver) return;
    plane.update();
    // obstacles
    obstacles.forEach(o => o.update());
    if (obstacles[0] && obstacles[0].x + obstacles[0].width < 0) obstacles.shift();
    if (frame % (OBSTACLE_GAP * 0.8) === 0) spawnObstacle();
    // clouds (parallax)
    clouds.forEach(c => c.update());
    if (clouds[0] && clouds[0].x + clouds[0].width < 0) clouds.shift();
    if (Math.random() < 0.02) spawnCloud(); // occasional clouds
    // collisions
    for (const o of obstacles) {
      if (o.collides(plane)) { gameOver = true; break; }
      if (!o.passed && o.x + o.width < plane.x) { o.passed = true; score++; }
    }
    // gusts
    gusts.forEach(g => g.update());
    if (gusts[0] && gusts[0].x + gusts[0].radius < 0) gusts.shift();
    if (Math.random() < GUST_CHANCE) spawnGust();
    for (let i = gusts.length - 1; i >= 0; i--) {
      if (gusts[i].collect(plane)) {
        gusts.splice(i, 1);
        score += 2;
      }
    }
    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#b0e0e6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw background clouds (parallax)
    clouds.forEach(c => c.draw());

    plane.draw();
    obstacles.forEach(o => o.draw());
    gusts.forEach(g => g.draw());
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
      ctx.fillText('Press Space or Click to Restart', WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Input handling
  function onBoost() {
    if (gameOver) { reset(); return; }
    plane.boost();
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') onBoost(); });
  canvas.addEventListener('mousedown', onBoost);

  // start
  reset();
  loop();
})();
