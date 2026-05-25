// Meteor Dodge game – simple canvas implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const width = canvas.width;
  const height = canvas.height;

  // Ship definition (bottom centre) – drawn as a triangle
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      // triangle ship pointing up
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > width) this.x = width - this.w;
    },
  };

  // Meteor class
  class Meteor {
    constructor() {
      this.r = 15 + Math.random() * 10; // radius
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = 2 + Math.random() * 3;
    }
    draw() {
      // meteor with radial gradient for a glowing effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#8b0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    update() {
      this.y += this.speed;
    }
    offscreen() {
      return this.y - this.r > height;
    }
    collides(ship) {
      // simple AABB vs circle approximation
      const sx2 = ship.x + ship.w;
      const sy2 = ship.y + ship.h;
      const cx = this.x;
      const cy = this.y;
      const nearestX = Math.max(ship.x, Math.min(cx, sx2));
      const nearestY = Math.max(ship.y, Math.min(cy, sy2));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
      return dx * dx + dy * dy < this.r * this.r;
    }
  }

  let meteors = [];
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  let startTime = null;
  let gameOver = false;
  let score = 0;

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  function updateStars() {
    for (const s of stars) {
      s.y += 0.3; // slow downward movement
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  function update(dt) {
    // ship movement
    ship.dx = 0;
    if (keys.left) ship.dx = -ship.speed;
    if (keys.right) ship.dx = ship.speed;
    ship.update();

    // stars background movement
    updateStars();

    // meteors
    meteors.forEach(m => m.update());
    meteors = meteors.filter(m => !m.offscreen());
    // spawn
    if (Date.now() - lastSpawn > spawnInterval) {
      meteors.push(new Meteor());
      lastSpawn = Date.now();
      // play subtle spawn sound
      playBeep(600, 80);
    }
    // collision
    for (const m of meteors) {
      if (m.collides(ship)) {
        gameOver = true;
        // play collision/explosion sound
        playBeep(200, 300);
        break;
      }
    }
    // score based on survival time
    if (!gameOver && startTime !== null) {
      score = Math.floor((Date.now() - startTime) / 1000);
    }
  }

  function draw() {
    // dark space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // game objects
    ship.draw();
    meteors.forEach(m => m.draw());
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastTime = 0;
  requestAnimationFrame(loop);
})();
