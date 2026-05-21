// Asteroid Dodge game – targets <canvas id="game"></canvas>
(() => {
const canvas = document.getElementById('game');
   if (!canvas) return; // canvas not found
   // Set high‑resolution canvas size
   if (canvas.width !== canvas.clientWidth) canvas.width = canvas.clientWidth;
   if (canvas.height !== canvas.clientHeight) canvas.height = canvas.clientHeight;
  const ctx = canvas.getContext('2d');
  // Audio setup
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
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let width = canvas.width;
  let height = canvas.height;

  // Player ship (simple triangle)
  const ship = {
    x: width / 2,
    y: height - 40,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
    draw() {
      // Ship gradient fill
      const grad = ctx.createLinearGradient(this.x, this.y - this.size, this.x, this.y + this.size);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#080');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
      // Ship outline
      ctx.strokeStyle = '#0c0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function moveShip() {
    ship.dx = 0;
    ship.dy = 0;
    let moved = false;
    if (keys.ArrowLeft) { ship.dx = -ship.speed; moved = true; }
    if (keys.ArrowRight) { ship.dx = ship.speed; moved = true; }
    if (keys.ArrowUp) { ship.dy = -ship.speed; moved = true; }
    if (keys.ArrowDown) { ship.dy = ship.speed; moved = true; }
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x + ship.dx));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y + ship.dy));
    if (moved) playSound(300, 0.04); // thrust sound
  }

  // Asteroids
  const asteroids = [];
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }
  let spawnCounter = 0;
  const spawnInterval = 60; // frames

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (width - 2 * radius) + radius;
    const y = -radius;
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y, radius, speed });
    // asteroid spawn sound
    playSound(180, 0.08);
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
      }
    }
    if (spawnCounter++ >= spawnInterval) {
      spawnCounter = 0;
      spawnAsteroid();
    }
  }

  function drawStars() {
    stars.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      // optional outline
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  // Collision detection
  function collides() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.size) return true;
    }
    return false;
  }

  let score = 0;
  let gameOver = false;

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
ctx.fillRect(0, 0, width, height);
    drawStars();
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2 - 50, height / 2 + 30);
      return;
    }
    // Draw background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#003566');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
    moveShip();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
if (collides()) {
        // Collision sound
        playSound(120, 0.3);
        gameOver = true;
      }
    score++;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    requestAnimationFrame(loop);
  }

  // Start the game once the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
