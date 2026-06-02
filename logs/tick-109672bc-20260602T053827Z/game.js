// Asteroid Dodger – minimal implementation
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  // ----- Sound assets -----
  const sounds = {
    thrust: new Audio('thrust.wav'),
    explosion: new Audio('explosion.wav'),
    shield: new Audio('shield.wav'),
    powerup: new Audio('powerup.wav'),
    gameover: new Audio('gameover.wav'),
  };
  // set volume levels
  sounds.thrust.volume = 0.3;
  sounds.explosion.volume = 0.4;
  sounds.shield.volume = 0.5;
  sounds.powerup.volume = 0.5;
  sounds.gameover.volume = 0.6;


  // ----- Game objects -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    shield: false,
    shieldTimer: 0,
    thrusting: false,
  };

  // starfield for background
  const stars = [];
  const STAR_COUNT = 120;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.save();
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // particle system for explosions
  const particles = [];
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const speed = Math.random() * 2 + 1;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = Math.random() * 2 + 1;
      this.life = Math.random() * 30 + 30; // frames
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(this.life / 60, 0);
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  function spawnExplosion(x, y) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y));
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    particles.forEach(p => p.draw());
  }

  // power‑up with glow
  class PowerUp {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.baseRadius = 8;
      this.radius = this.baseRadius;
      this.active = true;
      this.pulse = 0;
    }
    draw() {
      if (!this.active) return;
      this.pulse += 0.1;
      this.radius = this.baseRadius + Math.sin(this.pulse) * 2;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = 'lime';
      ctx.shadowColor = 'lime';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }



  class Asteroid {
    constructor() {
      const edge = Math.floor(Math.random() * 4);
      // spawn on random edge
      if (edge === 0) { // top
        this.x = Math.random() * width;
        this.y = -20;
      } else if (edge === 1) { // right
        this.x = width + 20;
        this.y = Math.random() * height;
      } else if (edge === 2) { // bottom
        this.x = Math.random() * width;
        this.y = height + 20;
      } else { // left
        this.x = -20;
        this.y = Math.random() * height;
      }
      const speed = 0.5 + Math.random() * 1.5;
      const angle = Math.atan2(ship.y - this.y, ship.x - this.x);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = 15 + Math.random() * 10;
      // rotation for visual flair
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.02;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      // wrap around
      if (this.x < -30) this.x = width + 30;
      if (this.x > width + 30) this.x = -30;
      if (this.y < -30) this.y = height + 30;
      if (this.y > height + 30) this.y = -30;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      // rocky gradient
      const grad = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }



  const asteroids = [];
  let powerUp = null;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function updateShip() {
    if (keys['ArrowLeft']) ship.angle -= 0.07;
    if (keys['ArrowRight']) ship.angle += 0.07;
    if (keys['ArrowUp']) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.thrusting = true;
      // play thrust sound (restart to allow rapid repeats)
      sounds.thrust.currentTime = 0;
      sounds.thrust.play();
    } else {
      ship.thrusting = false;
    }
    // apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap ship
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // shield timer
    if (ship.shield) {
      ship.shieldTimer -= 1 / 60;
      if (ship.shieldTimer <= 0) ship.shield = false;
    }
  }

  function spawnAsteroid() {
    if (asteroids.length < 10) asteroids.push(new Asteroid());
  }

  function spawnPowerUp() {
    if (!powerUp) powerUp = new PowerUp();
  }

  function checkCollisions() {
    // ship vs asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        if (ship.shield) {
          // destroy asteroid, consume shield
          const exX = a.x;
          const exY = a.y;
          asteroids.splice(i, 1);
          ship.shield = false;
          spawnExplosion(exX, exY);
          sounds.explosion.play();
          sounds.shield.play();
        } else {
          gameOver = true;
          sounds.explosion.play();
          sounds.gameover.play();
        }
      }
    }
    // ship vs power‑up
    if (powerUp && powerUp.active) {
      const dx = powerUp.x - ship.x;
      const dy = powerUp.y - ship.y;
      if (Math.hypot(dx, dy) < powerUp.radius + ship.radius) {
        ship.shield = true;
        ship.shieldTimer = 5; // seconds
        powerUp.active = false;
        powerUp = null;
        sounds.shield.play();
        sounds.powerup.play();
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body with subtle gradient
    const grad = ctx.createLinearGradient(0, -12, 0, 12);
    grad.addColorStop(0, ship.shield ? 'cyan' : '#99d');
    grad.addColorStop(1, ship.shield ? '#33f' : '#fff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (ship.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    // dark space background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);
    // stars
    drawStars();
    // ship and objects
    drawShip();
    asteroids.forEach(a => a.draw());
    // particles
    drawParticles();
    if (powerUp) powerUp.draw();
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // ----- Main loop -----
  let lastAsteroidSpawn = 0;
  let lastPowerSpawn = 0;
  function loop(timestamp) {
    if (gameOver) { draw(); return; }
    const delta = timestamp - (lastAsteroidSpawn || timestamp);
    if (delta > 2000) { // spawn every 2 seconds
      spawnAsteroid();
      lastAsteroidSpawn = timestamp;
    }
    if (timestamp - lastPowerSpawn > 10000) { // power‑up every 10 s
      spawnPowerUp();
      lastPowerSpawn = timestamp;
    }
    updateShip();
    asteroids.forEach(a => a.update());
    updateParticles();
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
