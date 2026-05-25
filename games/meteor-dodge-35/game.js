// Simple Meteor Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Player ship
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 4, dx: 0 };
  // Meteors
  const meteors = [];
  let meteorTimer = 0;
// Stars for background
const starCount = 80;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    alpha: Math.random() * 0.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2
  });
}
// Sound setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let explosionPlayed = false;
function playExplosion() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}
  const meteorInterval = 80; // frames
  const meteorSpeed = 2;
  // Score
  let frames = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    if (gameOver) return;
    // Move ship based on input (arrow keys or A/D)
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    else if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x += ship.dx;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Update stars (background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = -s.size;
        s.x = Math.random() * width;
      }
    }

    // Spawn meteors
    if (meteorTimer <= 0) {
      const size = Math.random() * 30 + 10;
      meteors.push({ x: Math.random() * (width - size), y: -size, w: size, h: size });
      meteorTimer = meteorInterval;
    } else {
      meteorTimer--;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += meteorSpeed + frames * 0.001; // gradual speed increase
      // Remove off‑screen meteors
      if (m.y > height) meteors.splice(i, 1);
      // Collision detection
      if (
        ship.x < m.x + m.w &&
        ship.x + ship.w > m.x &&
        ship.y < m.y + m.h &&
        ship.y + ship.h > m.y
      ) {
        gameOver = true;
        if (!explosionPlayed) {
          playExplosion();
          explosionPlayed = true;
        }
      }
    }
    frames++;
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Meteors (radial gradient circles)
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, m.w * 0.1, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(frames / 60), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // Start loop
  requestAnimationFrame(loop);
})();
