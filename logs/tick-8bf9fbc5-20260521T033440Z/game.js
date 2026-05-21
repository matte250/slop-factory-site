// Simple Meteor Dodge game targeting canvas with id="game"
(() => {
  // Create starfield background
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width;
  const height = canvas.height;

  // Ship configuration
  const ship = {
    x: width / 2,
    y: height - 30,
    radius: 15,
    speed: 4,
    dx: 0,
    dy: 0,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Meteor class
  class Meteor {
    constructor() {
      this.reset();
    }
reset() {
    this.x = Math.random() * width;
    this.y = -20; // start above canvas
    const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6; // -30° to +30°
    const speed = 2 + Math.random() * 3; // 2-5 px/frame
    this.vx = Math.sin(angle) * speed;
    this.vy = Math.cos(angle) * speed;
    this.radius = 10 + Math.random() * 10; // 10-20
    beep(200, 0.08); // spawn sound
  }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y - this.radius > height || this.x < -this.radius || this.x > width + this.radius) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = '#888';
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const meteors = [];
  const METEOR_COUNT = 5;
  for (let i = 0; i < METEOR_COUNT; i++) meteors.push(new Meteor());

  let startTime = performance.now();
  let gameOver = false;

function updateShip() {
    ship.dx = 0;
    ship.dy = 0;
    let moved = false;
    if (keys.ArrowLeft) { ship.dx = -ship.speed; moved = true; }
    if (keys.ArrowRight) { ship.dx = ship.speed; moved = true; }
    if (keys.ArrowUp) { ship.dy = -ship.speed; moved = true; }
    if (keys.ArrowDown) { ship.dy = ship.speed; moved = true; }
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y + ship.dy));
    if (moved) beep(400, 0.05);
  }

  function drawShip() {
    ctx.beginPath();
    ctx.fillStyle = '#0f0';
    ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function checkCollision() {
    for (const m of meteors) {
      const dx = m.x - ship.x;
      const dy = m.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < m.radius + ship.radius) {
        gameOver = true;
        beep(150, 0.3); // collision sound
        break;
      }
    }
  }

  function drawScore() {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    drawStars();
    if (!gameOver) {
      updateShip();
      meteors.forEach((m) => m.update());
      checkCollision();
    }
    drawShip();
    meteors.forEach((m) => m.draw());
    drawScore();
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
