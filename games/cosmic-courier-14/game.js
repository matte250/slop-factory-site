// Simple Cosmic Courier game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
const H = canvas.height = canvas.clientHeight || 600;

   // ----- Audio support -----
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   function playTone(freq, duration) {
     const oscillator = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     oscillator.type = 'sine';
     oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
     oscillator.connect(gain);
     gain.connect(audioCtx.destination);
     gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
     oscillator.start();
     gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
     oscillator.stop(audioCtx.currentTime + duration/1000);
   }
   const sounds = {
     boost: () => playTone(600, 100),
     collect: () => playTone(800, 80),
     crash: () => playTone(200, 300),
     checkpoint: () => playTone(400, 200),
   };

   // ----- Visual enhancements -----
  // Generate starfield
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----- Game objects -----
  class Ship {
    constructor() {
      this.x = W / 2;
      this.y = H - 60;
      this.r = 12; // radius for collision
      this.speed = 2;
      this.vx = 0;
      this.boost = false;
      // gradient for ship hull
      this.gradient = ctx.createLinearGradient(0, -this.r, 0, this.r);
      this.gradient.addColorStop(0, '#0ff');
      this.gradient.addColorStop(1, '#00f');
    }
    update() {
      // automatic forward motion (upwards)
      this.y -= 1;
      // horizontal control
      this.x += this.vx;
      // boost adds extra forward speed
      if (this.boost) this.y -= 2;
      // keep within bounds
      if (this.x < this.r) this.x = this.r;
      if (this.x > W - this.r) this.x = W - this.r;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.moveTo(0, -this.r);
      ctx.lineTo(this.r, this.r);
      ctx.lineTo(-this.r, this.r);
      ctx.closePath();
      ctx.fillStyle = this.gradient;
      ctx.fill();
      ctx.restore();
    }
  }

  class Asteroid {
    constructor() {
      this.x = Math.random() * W;
      this.y = -20;
      this.r = 15 + Math.random() * 20;
      this.vy = 1 + Math.random() * 2;
    }
    update() { this.y += this.vy; }
    draw() { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill(); }
  }

  class Cargo {
    constructor() {
      this.x = Math.random() * W;
      this.y = -20;
      this.r = 8;
      this.vy = 1.5;
      this.collected = false;
    }
    update() { this.y += this.vy; }
    draw() { if (this.collected) return; ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill(); }
  }

  class Checkpoint {
    constructor() { this.y = -100; this.vy = 1; this.h = 10; }
    update() { this.y += this.vy; }
    draw() { ctx.fillStyle = '#0f0'; ctx.fillRect(0, this.y, W, this.h); }
  }

  const ship = new Ship();
  const asteroids = [];
  const cargos = [];
  const checkpoint = new Checkpoint();
  let score = 0;
  let gameOver = false;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space') sounds.boost();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawn() {
    if (Math.random() < 0.02) asteroids.push(new Asteroid());
    if (Math.random() < 0.01) cargos.push(new Cargo());
  }

  function checkCollisions() {
    // ship with asteroids
    for (const a of asteroids) {
      const dx = ship.x - a.x, dy = ship.y - a.y;
      if (Math.hypot(dx, dy) < ship.r + a.r) {
        gameOver = true;
        sounds.crash();
      }
    }
    // ship with cargo
    for (const c of cargos) {
      if (c.collected) continue;
      const dx = ship.x - c.x, dy = ship.y - c.y;
      if (Math.hypot(dx, dy) < ship.r + c.r) {
        c.collected = true;
        score += 10;
        sounds.collect();
      }
    }
    // ship with checkpoint (delivery)
    if (ship.y < checkpoint.y + checkpoint.h && ship.y > checkpoint.y) {
      // deliver all collected cargo
      score += 50;
      // reset cargo positions
      cargos.length = 0;
      sounds.checkpoint();
    }
    // ship leaves screen edges
    if (ship.x < 0 || ship.x > W || ship.y < 0) {
      gameOver = true;
      sounds.crash();
    }
  }

  function update() {
    // move stars for parallax effect
    stars.forEach(s => { s.y += 0.3; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
    if (gameOver) return;
    // input handling
    ship.vx = 0;
    if (keys['ArrowLeft']) ship.vx = -ship.speed;
    if (keys['ArrowRight']) ship.vx = ship.speed;
    ship.boost = !!keys['Space'];

    ship.update();
    asteroids.forEach(a => a.update());
    cargos.forEach(c => c.update());
    checkpoint.update();
    // remove off‑screen objects
    while (asteroids.length && asteroids[0].y - asteroids[0].r > H) asteroids.shift();
    while (cargos.length && cargos[0].y - cargos[0].r > H) cargos.shift();
    spawn();
    checkCollisions();
  }

function draw() {
        // clear canvas
        ctx.clearRect(0, 0, W, H);
        // background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        // starfield
        drawStars();
        // draw game objects with subtle glow
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 4;
        ship.draw();
        asteroids.forEach(a => a.draw());
        cargos.forEach(c => c.draw());
        ctx.shadowBlur = 0; // reset shadow
        checkpoint.draw();
        // HUD
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.fillText('Score: ' + score, 10, 20);
        if (gameOver) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(0,0,W,H);
          ctx.fillStyle = '#f00';
          ctx.textAlign = 'center';
          ctx.font = '48px sans-serif';
          ctx.fillText('Game Over', W/2, H/2);
        }
      }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
