// Game based on IDEA.md – Meteor Escape
// Targets canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // ----- Audio -----
  const sounds = {
    explosion: new Audio('https://cdn.jsdelivr.net/gh/jasonm23/awesome-sounds/explosion.mp3'),
    shield: new Audio('https://cdn.jsdelivr.net/gh/jasonm23/awesome-sounds/powerup.mp3'),
    bg: new Audio('https://cdn.jsdelivr.net/gh/jasonm23/awesome-sounds/bg.mp3')
  };
  sounds.bg.loop = true;
  sounds.bg.volume = 0.3;
  sounds.bg.play();

  // ----- Input -----
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- Enhanced Graphics -----
  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  function updateStars(dt) {
    for (const s of stars) {
      s.y += s.speed * dt * 0.05; // adjust speed based on dt
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = -s.size;
        s.size = Math.random() * 2 + 1;
        s.speed = Math.random() * 0.5 + 0.2;
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  // Ship drawing with gradient
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 40,
    speed: 4,
    shield: false,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      const grad = ctx.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
      grad.addColorStop(0, this.shield ? 'cyan' : 'lightgray');
      grad.addColorStop(1, this.shield ? 'blue' : 'white');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(-this.w / 2, this.h / 2);
      ctx.lineTo(this.w / 2, this.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      if (keys.ArrowLeft) this.x -= this.speed;
      if (keys.ArrowRight) this.x += this.speed;
      if (keys.ArrowUp) this.y -= this.speed * 1.5;
      if (keys.ArrowDown) this.y += this.speed * 0.5;
      this.x = Math.max(this.w / 2, Math.min(width - this.w / 2, this.x));
      this.y = Math.max(this.h / 2, Math.min(height - this.h / 2, this.y));
    }
  };

  class Meteor {
    constructor() {
      this.r = Math.random() * 15 + 10;
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = Math.random() * 2 + 1;
      // create a radial gradient for each meteor
      this.grad = null;
    }
    update() { this.y += this.speed; }
    draw() {
      const gradient = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      gradient.addColorStop(0, '#aaa');
      gradient.addColorStop(1, '#444');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() { return this.y - this.r > height; }
    collides(ship) {
      const dx = this.x - ship.x;
      const dy = this.y - ship.y;
      const dist = Math.hypot(dx, dy);
      return dist < this.r + Math.max(ship.w, ship.h) / 2;
    }
  }

  class PowerUp {
    constructor() {
      this.r = 12;
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = 1.5;
      this.pulse = 0;
    }
    update(dt) { this.y += this.speed; this.pulse += dt * 0.005; }
    draw() {
      const pulseScale = 0.8 + Math.abs(Math.sin(this.pulse)) * 0.2;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(pulseScale, pulseScale);
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    offScreen() { return this.y - this.r > height; }
    collides(ship) {
      const dx = this.x - ship.x;
      const dy = this.y - ship.y;
      const dist = Math.hypot(dx, dy);
      return dist < this.r + Math.max(ship.w, ship.h) / 2;
    }
  }

  
  const meteors = [];
  const powerUps = [];
  let lastMeteor = 0;
  let lastPower = 0;
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnMeteor() {
    meteors.push(new Meteor());
  }
  function spawnPower() {
    powerUps.push(new PowerUp());
  }

  function update(dt) {
    if (gameOver) return;
    ship.update();

    // spawn meteors every 800ms
    if (performance.now() - lastMeteor > 800) { spawnMeteor(); lastMeteor = performance.now(); }
    // spawn power-ups every 5000ms
    if (performance.now() - lastPower > 5000) { spawnPower(); lastPower = performance.now(); }

    meteors.forEach(m => m.update());
    powerUps.forEach(p => p.update());

    // remove off‑screen meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].offScreen()) meteors.splice(i, 1);
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (powerUps[i].offScreen()) powerUps.splice(i, 1);
    }

    // collisions
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].collides(ship)) {
        if (ship.shield) {
          // shield absorbs meteor
          sounds.explosion.play();
          ship.shield = false; // shield consumed
          meteors.splice(i, 1);
        } else {
          // ship destroyed
          sounds.explosion.play();
          gameOver = true;
        }
        break;
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (powerUps[i].collides(ship)) {
        ship.shield = true; // activate shield
        powerUps.splice(i, 1);
      }
    }

    // scoring based on survival time
    const now = performance.now();
    score = Math.floor((now - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // starfield background (simple)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw ship, meteors, power‑ups
    ship.draw();
    meteors.forEach(m => m.draw());
    powerUps.forEach(p => p.draw());
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (ship.shield) {
      ctx.fillStyle = 'cyan';
      ctx.fillText('Shield', 10, 40);
    }
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastRender || timestamp);
    lastRender = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastRender;
  requestAnimationFrame(loop);
})();
