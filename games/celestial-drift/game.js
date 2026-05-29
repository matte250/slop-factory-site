// Game: Celestial Drift
// Implements a simple canvas game per IDEA.md

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // --- Audio ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playLaser = () => playSound(800, 0.08);
  const playExplosion = () => playSound(100, 0.4);
  const playThrust = () => playSound(300, 0.05);

  // --- Utility ---
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Pre‑generated starfield for parallax effect
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      size: rand(0.5, 2),
      speed: rand(0.2, 0.8),
    });
  }

  // --- Game objects ---
  class Ship {
    constructor() {
      this.x = width / 2;
      this.y = height - 60;
      this.r = 0; // rotation radians
      this.vx = 0;
      this.vy = 0;
      this.thrust = 0.1;
      this.radius = 10;
      this.shield = false;
      this.health = 3;
    }
    update(keys) {
      if (keys.ArrowLeft || keys.KeyA) this.r -= 0.07;
      if (keys.ArrowRight || keys.KeyD) this.r += 0.07;
      // thrust flag for rendering flame
      this.thrusting = keys.ArrowUp || keys.KeyW;
      if (this.thrusting) {
        this.vx += Math.cos(this.r) * this.thrust;
        this.vy += Math.sin(this.r) * this.thrust;
        playThrust();
      }
      // Apply velocity with simple friction
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.99;
      this.vy *= 0.99;
      // Keep within bounds (wrap around)
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    }
    draw() {
      // draw ship body
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.r);
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fillStyle = this.shield ? 'cyan' : 'white';
      ctx.fill();
      // thrust flame
      if (this.thrusting) {
        ctx.beginPath();
        ctx.moveTo(0, this.radius);
        ctx.lineTo(3, this.radius + 6);
        ctx.lineTo(-3, this.radius + 6);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class Asteroid {
    constructor() {
      this.x = rand(0, width);
      this.y = -20;
      this.r = rand(15, 30);
      this.vy = rand(1, 3);
    }
    update() { this.y += this.vy; }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = '#888';
      ctx.fill();
    }
    offscreen() { return this.y - this.r > height; }
  }

  class Laser {
    constructor(x, y, r) {
      this.x = x;
      this.y = y;
      this.r = r;
      this.vy = -6;
    }
    update() { this.y += this.vy; }
    draw() {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y + 10);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    offscreen() { return this.y < 0; }
  }

  // --- State ---
  const ship = new Ship();
  let asteroids = [];
  let lasers = [];
  let keys = {};
  let score = 0;
  let gameOver = false;
  let spawnTimer = 0;

  // --- Input ---
  window.addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); audioCtx.resume(); });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function spawnAsteroid() {
    asteroids.push(new Asteroid());
  }

  function fireLaser() {
    playLaser();
    lasers.push(new Laser(ship.x, ship.y, ship.r));
  }

    function checkCollisions() {
      // ship vs asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        const dx = a.x - ship.x;
        const dy = a.y - ship.y;
        const dist = Math.hypot(dx, dy);
        if (dist < a.r + ship.radius) {
          if (ship.shield) {
            // destroy asteroid with shield
            asteroids.splice(i, 1);
            score += 10;
            playExplosion();
          } else {
            ship.health--;
            asteroids.splice(i, 1);
            playExplosion();
            if (ship.health <= 0) gameOver = true;
          }
        }
      }
      // lasers vs asteroids
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const a = asteroids[j];
          const dx = a.x - l.x;
          const dy = a.y - l.y;
          if (Math.hypot(dx, dy) < a.r) {
            // destroy both
            lasers.splice(i, 1);
            asteroids.splice(j, 1);
            score += 10;
            playExplosion();
            break;
          }
        }
      }
    }

  // --- Main loop ---
  function loop() {
    if (gameOver) {
      // background gradient for game over
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#000022');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 40);
      return;
    }
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#000011');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw starfield with parallax
    stars.forEach(star => {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      star.y += star.speed;
      if (star.y > height) {
        star.x = rand(0, width);
        star.y = -star.size;
        star.size = rand(0.5, 2);
        star.speed = rand(0.2, 0.8);
      }
    });
    // update objects
    ship.update(keys);
    if (keys.Space) fireLaser();
    lasers.forEach(l => l.update());
    asteroids.forEach(a => a.update());
    // remove offscreen
    lasers = lasers.filter(l => !l.offscreen());
    asteroids = asteroids.filter(a => !a.offscreen());
    // spawn asteroids
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = Math.max(30, 100 - Math.floor(score / 50));
    }
    // collisions
    checkCollisions();
    // draw objects
    ship.draw();
    lasers.forEach(l => l.draw());
    asteroids.forEach(a => a.draw());
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${ship.health}`, 10, 40);
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
