// Game: Asteroid Courier - enhanced graphics
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Utility functions
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(200, 0.05);
  const playCollect = () => playTone(800, 0.07);
  const playExplosion = () => playTone(100, 0.3);
  const playWin = () => playTone(600, 0.5);
  const playLose = () => playTone(50, 0.5);

  // ---- Entities ----
  class Ship {
    constructor() {
      this.x = width / 2;
      this.y = height / 2;
      this.r = 12; // radius for collision
      this.angle = 0; // radians
      this.vx = 0;
      this.vy = 0;
      this.thrust = 0.1;
      this.turnSpeed = 0.07;
      this.trail = [];
    }
    update(keys) {
      if (keys.left) this.angle -= this.turnSpeed;
      if (keys.right) this.angle += this.turnSpeed;
      if (keys.up) {
        this.vx += Math.cos(this.angle) * this.thrust;
        this.vy += Math.sin(this.angle) * this.thrust;
      }
      this.x += this.vx;
      this.y += this.vy;
      // friction
      this.vx *= 0.99;
      this.vy *= 0.99;
      // wrap
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
      // trail storage
      this.trail.push({ x: this.x, y: this.y, angle: this.angle });
      if (this.trail.length > 20) this.trail.shift();
    }
    draw() {
      // trail
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        const fade = i / this.trail.length;
        ctx.globalAlpha = 0.4 * (1 - fade);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.setTransform(1,0,0,1,0,0);
      }
      ctx.restore();

      // Ship body
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const grad = ctx.createLinearGradient(-15, 0, 15, 0);
      grad.addColorStop(0, '#00aaff');
      grad.addColorStop(1, '#0055ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      // Thrust flame
      if (keys.up) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
      }
    }
  }

  class Asteroid {
    constructor() {
      this.x = rand(0, width);
      this.y = rand(0, height);
      this.r = rand(15, 30);
      const speed = rand(0.5, 1.5);
      const dir = rand(0, Math.PI * 2);
      this.vx = Math.cos(dir) * speed;
      this.vy = Math.sin(dir) * speed;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -this.r) this.x = width + this.r;
      if (this.x > width + this.r) this.x = -this.r;
      if (this.y < -this.r) this.y = height + this.r;
      if (this.y > height + this.r) this.y = -this.r;
    }
    draw() {
      const grad = ctx.createRadialGradient(
        this.x, this.y, this.r * 0.2,
        this.x, this.y, this.r
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.stroke();
    }
  }

  class Cargo {
    constructor() {
      this.x = rand(0, width);
      this.y = rand(0, height);
      this.r = 8;
      this.collected = false;
    }
    draw() {
      if (this.collected) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      const grad = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
      grad.addColorStop(0, '#ffdd33');
      grad.addColorStop(1, '#aa7700');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---- Game State ----
  const ship = new Ship();
  const asteroids = Array.from({ length: 8 }, () => new Asteroid());
  const cargos = Array.from({ length: 5 }, () => new Cargo());
  // Starfield background
  const stars = Array.from({ length: 100 }, () => ({
    x: rand(0, width),
    y: rand(0, height),
    radius: rand(0.5, 1.5)
  }));
  let timeLeft = 60; // seconds
  let lastTimestamp = null;
  const keys = { left: false, right: false, up: false };
  let gameOver = false;
  let win = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp') {
      keys.up = true;
      playThrust();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp') keys.up = false;
  });

  function checkCollisions() {
    // Ship vs asteroids
    for (const a of asteroids) {
      if (dist(ship, a) < ship.r + a.r) {
        playExplosion();
        gameOver = true;
      }
    }
    // Ship vs cargo
    for (const c of cargos) {
      if (!c.collected && dist(ship, c) < ship.r + c.r) {
        c.collected = true;
      }
    }
  }

  function update(dt) {
    if (gameOver) return;
    ship.update(keys);
    for (const a of asteroids) a.update();
    checkCollisions();
    if (cargos.every(c => c.collected)) {
      win = true;
      gameOver = true;
    }
    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) {
      timeLeft = 0;
      gameOver = true;
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw entities
    for (const c of cargos) c.draw();
    for (const a of asteroids) a.draw();
    ship.draw();
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, 10, 20);
    ctx.fillText(`Cargo: ${cargos.filter(c => !c.collected).length}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = win ? '#0f0' : '#f00';
      ctx.font = '48px sans-serif';
      const msg = win ? 'Mission Complete!' : 'Game Over';
      const tm = ctx.measureText(msg);
      ctx.fillText(msg, (width - tm.width) / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
