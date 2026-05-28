// Minimal Asteroid Dodger game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element #game not found');
  const ctx = canvas.getContext('2d');
  // Set background color
  ctx.fillStyle = 'black';

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(400, 0.1); }
  function playCrash() { playTone(100, 0.5); }
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Create starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  class Ship {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.angle = 0; // radians
      this.radius = 10;
    }
    update(dt) {
      // rotation
      if (keys['ArrowLeft']) this.angle -= 3 * dt;
      if (keys['ArrowRight']) this.angle += 3 * dt;
      // thrust
      const thrust = 200; // pixels per second squared
      if (keys['ArrowUp']) {
        this.x += Math.cos(this.angle) * thrust * dt;
        this.y += Math.sin(this.angle) * thrust * dt;
        // play thrust sound
        playThrust();
      }
      // keep within bounds (wrap around)
      if (this.x < 0) this.x += canvas.width;
      if (this.x > canvas.width) this.x -= canvas.width;
      if (this.y < 0) this.y += canvas.height;
      if (this.y > canvas.height) this.y -= canvas.height;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      // Gradient for ship hull
      const grad = ctx.createLinearGradient(-15, 0, 15, 0);
      grad.addColorStop(0, '#8fbfff');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#cce6ff';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  class Asteroid {
    constructor() {
      // spawn at random edge
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { this.x = 0; this.y = Math.random() * canvas.height; }
      else if (edge === 1) { this.x = canvas.width; this.y = Math.random() * canvas.height; }
      else if (edge === 2) { this.x = Math.random() * canvas.width; this.y = 0; }
      else { this.x = Math.random() * canvas.width; this.y = canvas.height; }
      const speed = 50 + Math.random() * 100;
      const dir = Math.random() * Math.PI * 2;
      this.vx = Math.cos(dir) * speed;
      this.vy = Math.sin(dir) * speed;
      this.radius = 15 + Math.random() * 20;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      // wrap
      if (this.x < -this.radius) this.x = canvas.width + this.radius;
      if (this.x > canvas.width + this.radius) this.x = -this.radius;
      if (this.y < -this.radius) this.y = canvas.height + this.radius;
      if (this.y > canvas.height + this.radius) this.y = -this.radius;
    }
    draw() {
      // Asteroid gradient fill
      const grad = ctx.createRadialGradient(
        this.x, this.y, this.radius * 0.2,
        this.x, this.y, this.radius
      );
      grad.addColorStop(0, '#555555');
      grad.addColorStop(1, '#aaaaaa');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#777777';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  const ship = new Ship();
  const asteroids = [];
  let lastTime = performance.now();
  let spawnTimer = 0;
  let survived = 0;
  let gameOver = false;

  function spawnAsteroid() {
    asteroids.push(new Asteroid());
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) return true;
    }
    return false;
  }

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!gameOver) {
      survived += dt;
      // spawn every 1.5 seconds
      spawnTimer += dt;
      if (spawnTimer > 1.5) { spawnTimer = 0; spawnAsteroid(); }
      ship.update(dt);
      for (const a of asteroids) a.update(dt);
        if (checkCollision()) {
          playCrash();
          gameOver = true;
        }
    }
    // render
    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = 'rgba(255,255,255,1)';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ship.draw();
    for (const a of asteroids) a.draw();
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${survived.toFixed(2)}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
