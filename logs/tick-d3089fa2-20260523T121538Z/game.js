// Canvas Dodger – minimal implementation
// Assumes an HTML <canvas id="game"></canvas> present.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Ensure full‑size canvas
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Initialise starfield
  initStars();
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration = 100) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.1);
    }, duration);
  }
  function playMove() { playTone(400, 80); }
  function playExplosion() { playTone(100, 300); }

  // Ship definition
  // Starfield background
  const stars = [];
  const STAR_COUNT = 80;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }
  function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
    }
  }

  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // gradient ship (green to teal)
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#0ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      // clamp within canvas
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
    }
  };

  // Meteor definition
  class Meteor {
    constructor() {
      this.r = Math.random() * 15 + 10; // radius 10‑25
      this.x = Math.random() * (canvas.width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = 2 + Math.random() * 3; // 2‑5
    }
    update() {
      this.y += this.speed;
    }
    draw() {
      // radial gradient for fireball effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#ff8');
      grad.addColorStop(1, '#f44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() {
      return this.y - this.r > canvas.height;
    }
  }

  const meteors = [];
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  let startTime = null;
  let score = 0;
  let gameOver = false;

  function spawnMeteor(ts) {
    const m = new Meteor();
    meteors.push(m);
  }

  function checkCollision(m) {
    // simple AABB‑circle test
    const closestX = Math.max(ship.x, Math.min(m.x, ship.x + ship.w));
    const closestY = Math.max(ship.y, Math.min(m.y, ship.y + ship.h));
    const dx = m.x - closestX;
    const dy = m.y - closestY;
    return dx * dx + dy * dy < m.r * m.r;
  }

  function update(ts) {
    if (!startTime) startTime = ts;
    const delta = ts - (lastSpawn || ts);
    // spawn meteors
    if (ts - lastSpawn > spawnInterval) {
      spawnMeteor(ts);
      lastSpawn = ts;
    }
    // increase speed gradually
    meteors.forEach(m => m.speed += 0.00001);
    // update objects
    ship.update();
    meteors.forEach(m => m.update());
    // remove off‑screen meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].offScreen()) meteors.splice(i, 1);
    }
    // collision
    if (meteors.some(m => checkCollision(m))) {
      gameOver = true;
      playExplosion();
    }
    // score as seconds survived
    score = Math.floor((ts - startTime) / 1000);
  }

  function render() {
    // Draw starfield background first
    drawBackground();
    // Draw ship and meteors on top
    ship.draw();
    meteors.forEach(m => m.draw());
    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(ts) {
    if (!gameOver) {
      update(ts);
    }
    render();
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    // Unlock audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.key === 'ArrowLeft') {
      ship.dx = -ship.speed;
      playMove();
    }
    if (e.key === 'ArrowRight') {
      ship.dx = ship.speed;
      playMove();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ship.dx = 0;
  });

  // Start loop
  requestAnimationFrame(loop);
})();
