// Simple "Cosmic Dodge" game targeting <canvas id="game"></canvas>
// Enhanced graphics: gradients, shadows, background gradient.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // ------- audio setup -------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // ------- utilities -------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ------- game objects -------
  class Ship {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height - 60;
      this.radius = 12; // for collision
      this.speed = 4;
      this.health = 3;
      this.shield = 0; // ms remaining
    }
    move(dx, dy) {
      this.x = Math.min(Math.max(this.x + dx, this.radius), canvas.width - this.radius);
      this.y = Math.min(Math.max(this.y + dy, this.radius), canvas.height - this.radius);
    }
draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        // ship glow when shielded
        ctx.shadowBlur = this.shield > 0 ? 12 : 0;
        ctx.shadowColor = this.shield > 0 ? 'cyan' : 'transparent';
        const grad = ctx.createLinearGradient(0, -15, 0, 10);
        grad.addColorStop(0, this.shield > 0 ? 'cyan' : '#fff');
        grad.addColorStop(1, this.shield > 0 ? '#00f' : '#ccc');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    hit() {
      if (this.shield > 0) return; // ignore while shielded
      this.health--;
    }
    addShield(duration) {
      this.shield = duration;
    }
    update(dt) {
      if (this.shield > 0) this.shield -= dt;
    }
  }

  class Asteroid {
    constructor() {
      this.x = rand(20, canvas.width - 20);
      this.y = -20;
      this.r = rand(15, 30);
      this.speed = rand(1.5, 3);
    }
    update(dt) {
      this.y += this.speed;
    }
draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
        grad.addColorStop(0, '#777');
        grad.addColorStop(1, '#333');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#111';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    offscreen() {
      return this.y - this.r > canvas.height;
    }
  }

  class Projectile {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 4;
      this.h = 10;
      this.speed = 5;
    }
    update(dt) {
      this.y -= this.speed;
    }
    draw() {
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x - this.w / 2, this.y - this.h, this.w, this.h);
    }
    offscreen() {
      return this.y + this.h < 0;
    }
  }

  class PowerUp {
    constructor() {
      this.x = rand(30, canvas.width - 30);
      this.y = -20;
      this.r = 10;
      this.speed = 2;
    }
    update(dt) {
      this.y += this.speed;
    }
    draw() {
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.r);
      for (let i = 1; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.lineTo(this.x + Math.cos(angle) * this.r, this.y + Math.sin(angle) * this.r);
      }
      ctx.closePath();
      ctx.fill();
    }
    offscreen() {
      return this.y - this.r > canvas.height;
    }
  }

  // ------- starfield background -------
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, canvas.width), y: rand(0, canvas.height), size: rand(0.5, 2) });
  }
  const updateStars = () => {
    for (const s of stars) {
      s.y += 0.5;
      if (s.y > canvas.height) {
        s.x = rand(0, canvas.width);
        s.y = 0;
      }
    }
  };
  const drawStars = () => {
    for (const s of stars) {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ------- input handling -------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ------- game state -------
  const ship = new Ship();
  const asteroids = [];
  const projectiles = [];
  const powerUps = [];
  let lastSpawn = 0;
  let lastPowerUp = 0;
  let lastTime = performance.now();
  let gameOver = false;

  const spawnAsteroid = () => asteroids.push(new Asteroid());
  const spawnPowerUp = () => powerUps.push(new PowerUp());

  const fire = () => {
    // simple cooldown
    if (!ship.canFire) {
      ship.canFire = true;
      setTimeout(() => (ship.canFire = false), 300);
    }
    if (ship.canFire) {
      projectiles.push(new Projectile(ship.x, ship.y - 15));
      // shooting sound
      playTone(500, 0.05);
    }
  };

  // main loop
  const loop = now => {
    const dt = now - lastTime;
    lastTime = now;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
      return;
    }
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000040');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    updateStars();
    drawStars();
    // ship movement
    let dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.a) dx -= ship.speed;
    if (keys.ArrowRight || keys.d) dx += ship.speed;
    if (keys.ArrowUp || keys.w) dy -= ship.speed;
    if (keys.ArrowDown || keys.s) dy += ship.speed;
    ship.move(dx, dy);
    ship.update(dt);
    // fire
    if (keys[' '] || keys.Control) fire();
    // spawn asteroids
    lastSpawn += dt;
    if (lastSpawn > 1200) { // every 1.2s
      spawnAsteroid();
      lastSpawn = 0;
    }
    // spawn power‑up occasionally
    lastPowerUp += dt;
    if (lastPowerUp > 8000) {
      spawnPowerUp();
      lastPowerUp = 0;
    }
    // update & draw asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update(dt);
      a.draw();
      // collision with ship
      if (distance(a.x, a.y, ship.x, ship.y) < a.r + ship.radius) {
        ship.hit();
        // collision sound
        playTone(200, 0.1);
        asteroids.splice(i, 1);
        continue;
      }
      if (a.offscreen()) asteroids.splice(i, 1);
    }
    // update & draw power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.update(dt);
      p.draw();
if (distance(p.x, p.y, ship.x, ship.y) < p.r + ship.radius) {
          ship.addShield(5000); // 5 seconds
          // power‑up collection sound
          playTone(800, 0.2);
          powerUps.splice(i, 1);
          continue;
        }
      if (p.offscreen()) powerUps.splice(i, 1);
    }
    // update & draw projectiles (enemy fire simulated as downward rectangles)
    // For simplicity we only have player fire; collisions with asteroids could be added later.
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i];
      pr.update(dt);
      pr.draw();
      if (pr.offscreen()) { projectiles.splice(i, 1); continue; }
    }
    // draw ship last so it appears on top
    ship.draw();
    // check lose condition
    if (ship.health <= 0) gameOver = true;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
