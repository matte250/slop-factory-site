// Minimal Asteroid Escape game with improved graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth);
  const h = (canvas.height = canvas.clientHeight);
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playSound(400, 0.08); }
  function playExplosion() { for (let i = 0; i < 5; i++) playSound(150 + i * 40, 0.15 + i * 0.03); }
  function playCollect() { playSound(800, 0.05); }


    constructor() {
      this.x = w * 0.15;
      this.y = h * 0.5;
      this.r = 12; // radius for collision
      this.vx = 0;
      this.vy = 0;
      this.thrust = 0.2;
    }
    update() {
      this.vy += 0.02; // gravity‑like pull downwards
      this.x += this.vx;
      this.y += this.vy;
      // keep ship inside canvas
      if (this.y > h - this.r) this.y = h - this.r;
      if (this.y < this.r) this.y = this.r;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(-this.r, this.r);
      ctx.lineTo(this.r, this.r);
      ctx.lineTo(0, -this.r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    applyThrust() {
      this.vy -= this.thrust;
    }
  }

  class Asteroid {
    constructor(speed) {
      this.r = Math.random() * 15 + 10;
      this.x = w + this.r;
      this.y = Math.random() * (h - this.r * 2) + this.r;
      this.vx = -speed * (0.5 + Math.random() * 0.5);
      this.angle = Math.random() * Math.PI * 2;
      this.rotateSpeed = (Math.random() - 0.5) * 0.02;
    }
    update() {
      this.x += this.vx;
      this.angle += this.rotateSpeed;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const grad = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    offScreen() {
      return this.x + this.r < 0;
    }
  }

    class Orb {
      constructor(speed) {
        this.r = 6;
        this.x = w + this.r;
        this.y = Math.random() * (h - this.r * 2) + this.r;
        this.vx = -speed;
      }
      update() { this.x += this.vx; }
      draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        grad.addColorStop(0, 'rgba(255,255,150,0.9)');
        grad.addColorStop(1, 'rgba(255,200,0,0.5)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
      offScreen() { return this.x + this.r < 0; }
    }

  // ---- Game state ---------------------------------------------------------
  let ship = new Ship();
  let asteroids = [];
  let orbs = [];
  let frame = 0;
  let speed = 2; // base asteroid speed
  let score = 0;
  let highScore = parseInt(localStorage.getItem('asteroidHighScore') || '0', 10);
  let gameOver = false;

  // ---- Input -------------------------------------------------------------
  const thrustHandler = (e) => {
    e.preventDefault();
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!gameOver) {
      ship.applyThrust();
      playThrust();
    } else {
      restart();
    }
  };
  canvas.addEventListener('mousedown', thrustHandler);
  canvas.addEventListener('touchstart', thrustHandler);

  // ---- Main loop ----------------------------------------------------------
  function loop() {
    if (gameOver && particles.length === 0) return;
    frame++;
    // increase difficulty every 600 frames (~10s at 60fps)
    if (frame % 600 === 0) speed += 0.3;

    // spawn asteroids
    if (frame % 90 === 0) asteroids.push(new Asteroid(speed));
    // spawn orbs
    if (frame % 200 === 0) orbs.push(new Orb(speed * 0.8));

    // update entities
    ship.update();
    asteroids.forEach(a => a.update());
    orbs.forEach(o => o.update());

    // collision detection
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
if (Math.hypot(dx, dy) < ship.r + a.r) {
      playExplosion();
      endGame();
      return;
    }
    }
    // collect orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
if (Math.hypot(dx, dy) < ship.r + o.r) {
          score += 10;
          playCollect();
          orbs.splice(i, 1);
        } else if (o.offScreen()) {
        orbs.splice(i, 1);
      }
    }
    // remove off‑screen asteroids & increase score
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.offScreen()) {
        asteroids.splice(i, 1);
        score += 1;
      }
    }

    // draw
    ctx.clearRect(0, 0, w, h);
    // draw stars handled earlier via drawStars()
    ship.draw();
    asteroids.forEach(a => a.draw());
    orbs.forEach(o => o.draw());
    updateAndDrawParticles();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 40);

    requestAnimationFrame(loop);
  }

  function endGame() {
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('asteroidHighScore', highScore);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', w / 2, h / 2 - 30);
    ctx.fillText(`Score: ${score}`, w / 2, h / 2);
    ctx.fillText('Tap / Click to retry', w / 2, h / 2 + 30);
  }

  function restart() {
    ship = new Ship();
    asteroids = [];
    orbs = [];
    frame = 0;
    speed = 2;
    score = 0;
    gameOver = false;
    loop();
  }

  // start the game
  loop();
})();
