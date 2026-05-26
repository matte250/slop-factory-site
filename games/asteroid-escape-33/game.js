// Simple Asteroid Escape game implementation
// Canvas must exist with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Full‑screen canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const keys = { left: false, right: false, up: false };
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = osc;
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 80;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') {
      keys.up = true;
      startThrustSound();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') {
      keys.up = false;
      stopThrustSound();
    }
  });

  class Ship {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height * 0.8;
      this.angle = -Math.PI / 2; // point up
      this.velX = 0;
      this.velY = 0;
      this.radius = 12; // for collision approximation
    }
    update(dt) {
      // rotation
      const ROT_SPEED = 3; // rad/s
      if (keys.left) this.angle -= ROT_SPEED * dt;
      if (keys.right) this.angle += ROT_SPEED * dt;
      // thrust
      if (keys.up) {
        const THRUST = 200; // px/s²
        this.velX += Math.cos(this.angle) * THRUST * dt;
        this.velY += Math.sin(this.angle) * THRUST * dt;
      }
      // apply velocity
      this.x += this.velX * dt;
      this.y += this.velY * dt;
      // simple screen wrap
      if (this.x < 0) this.x += canvas.width;
      if (this.x > canvas.width) this.x -= canvas.width;
      if (this.y < 0) this.y += canvas.height;
      if (this.y > canvas.height) this.y -= canvas.height;
      // friction
      const FRICTION = 0.99;
      this.velX *= FRICTION;
      this.velY *= FRICTION;
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
      ctx.fillStyle = 'white';
      ctx.fill();
      // thrust flame
      if (keys.up) {
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class Asteroid {
    constructor() {
      this.radius = 15 + Math.random() * 20;
      this.x = Math.random() * canvas.width;
      this.y = -this.radius;
      this.speed = 50 + Math.random() * 70; // downwards speed
      // random rotation
      this.angle = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 2; // rad/sec
    }
    update(dt) {
      this.y += this.speed * dt;
      this.angle += this.rotSpeed * dt;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const grad = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }


  let ship = new Ship();
  let asteroids = [];
  // starfield
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 20 + Math.random() * 30,
    });
  }
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 1.0; // seconds
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  function reset() {
    ship = new Ship();
    asteroids = [];
    spawnTimer = 0;
    score = 0;
    gameOver = false;
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) return true;
    }
    return false;
  }

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!gameOver) {
      // update ship & entities
      ship.update(dt);
      spawnTimer += dt;
      if (spawnTimer > SPAWN_INTERVAL) {
        asteroids.push(new Asteroid());
        spawnTimer = 0;
      }
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.update(dt);
        if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
      }
      // update stars (simple vertical scroll)
      for (const s of stars) {
        s.y += s.speed * dt;
        if (s.y > canvas.height) s.y = 0;
      }
      const collided = checkCollision();
      if (collided) {
        gameOver = true;
        playExplosionSound();
      }
      score += dt;
    }
    // render background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    for (const s of stars) {
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    ship.draw();
    for (const a of asteroids) a.draw();
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Press R to Restart', canvas.width / 2, canvas.height / 2);
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'r' && gameOver) reset();
  });

  requestAnimationFrame(loop);
})();
