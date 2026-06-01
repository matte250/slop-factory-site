// Cosmic Courier – minimal HTML5 canvas game
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // ensure audio context can play after user interaction
  document.body.addEventListener('click', () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
  }, { once: true });
  // ---------- utility ----------
  const rand = (min, max) => Math.random() * (max - min) + min;

  // ---------- sound system ----------
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
  function playThrust() { playTone(200, 0.1); }
  function playDelivery() { playTone(600, 0.2); }
  function playExplosion() { playTone(100, 0.5); }
  function playGameOver() { playTone(50, 1); }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // generate a static starfield
  const STAR_COUNT = 100;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: rand(0, WIDTH),
    y: rand(0, HEIGHT),
    r: rand(0.5, 1.5)
  }));

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ---------- entities ----------
  class Ship {
    constructor() {
      this.x = WIDTH / 2;
      this.y = HEIGHT / 2;
      this.r = 12; // radius for collision
      this.vx = 0;
      this.vy = 0;
      this.angle = 0;
      this.fuel = 1000;
    }
    thrust(ax, ay) {
      const thrustPower = 0.15;
      this.vx += ax * thrustPower;
      this.vy += ay * thrustPower;
      this.fuel = Math.max(this.fuel - 1, 0);
      // sound effect for thrust
      try { playThrust(); } catch(e) {}
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      // simple drag
      this.vx *= 0.99;
      this.vy *= 0.99;
      // wrap around edges
      if (this.x < 0) this.x += WIDTH;
      if (this.x > WIDTH) this.x -= WIDTH;
      if (this.y < 0) this.y += HEIGHT;
      if (this.y > HEIGHT) this.y -= HEIGHT;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 12);
      ctx.lineTo(-8, 12);
      ctx.closePath();
      ctx.fillStyle = '#0ff';
      ctx.fill();
      ctx.restore();
    }
  }

  class Planet {
    constructor() {
      this.r = 30;
      this.x = rand(this.r, WIDTH - this.r);
      this.y = rand(this.r, HEIGHT - this.r);
      this.angle = 0;
      this.speed = 0.01; // rotation speed
    }
    update() { this.angle += this.speed; }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // radial gradient for planet surface
      const grad = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
      grad.addColorStop(0, '#a3e635'); // bright center
      grad.addColorStop(1, '#3b7d1d'); // darker edge
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  class Meteor {
    constructor() {
      this.r = rand(8, 20);
      this.x = rand(0, WIDTH);
      this.y = rand(0, HEIGHT);
      const dir = rand(0, Math.PI * 2);
      const speed = rand(0.5, 2);
      this.vx = Math.cos(dir) * speed;
      this.vy = Math.sin(dir) * speed;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      // wrap
      if (this.x < 0) this.x += WIDTH;
      if (this.x > WIDTH) this.x -= WIDTH;
      if (this.y < 0) this.y += HEIGHT;
      if (this.y > HEIGHT) this.y -= HEIGHT;
    }
    draw() {
      // meteor with radial gradient for a glowing effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.6, '#888');
      grad.addColorStop(1, '#555');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // ---------- game state ----------
  const ship = new Ship();
  let planet = new Planet();
  const meteors = Array.from({ length: 5 }, () => new Meteor());
  let score = 0;
  let delivered = 0;
  let gameOver = false;
  let gameOverSoundPlayed = false;

  // ---------- input ----------
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function handleInput() {
    if (keys['ArrowUp']) ship.thrust(0, -1);
    if (keys['ArrowDown']) ship.thrust(0, 1);
    if (keys['ArrowLeft']) ship.thrust(-1, 0);
    if (keys['ArrowRight']) ship.thrust(1, 0);
    // ship angle points towards velocity for visual cue
    if (ship.vx || ship.vy) ship.angle = Math.atan2(ship.vy, ship.vx) + Math.PI / 2;
  }

  // ---------- main loop ----------
  function loop() {
    if (gameOver) {
      // dark overlay for game over
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over – Score: ' + score, WIDTH / 2 - 100, HEIGHT / 2);
      return;
    }
    // clear with deep space background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // draw static stars
    drawStars();

    handleInput();
    ship.update();
    planet.update();
    meteors.forEach(m => m.update());

    // check delivery
    if (dist(ship, planet) < ship.r + planet.r) {
      score += 100;
      delivered++;
      // sound for successful delivery
      try { playDelivery(); } catch(e) {}
      // create new planet and maybe extra meteor
      planet = new Planet();
      if (delivered % 3 === 0) meteors.push(new Meteor());
    }

    // collision with meteors
for (const m of meteors) {
        if (dist(ship, m) < ship.r + m.r) {
          // sound for collision
          try { playExplosion(); } catch(e) {}
          gameOver = true;
          break;
        }
      }

    // fuel depletion
    if (ship.fuel <= 0) gameOver = true;

    // draw
    planet.draw();
    meteors.forEach(m => m.draw());
    ship.draw();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 40);
    ctx.fillText('Delivered: ' + delivered, 10, 60);

    requestAnimationFrame(loop);
  }

  loop();
})();
