// game.js – simple Color Drop arcade
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // ----- Config -----
  const COLORS = ['red', 'green', 'blue'];
  const PADDLE_W = 100;
  const PADDLE_H = 15;
  const PADDLE_Y = H - 30;
  const CIRCLE_R = 12;
  const SPAWN_INTERVAL = 800; // ms
  const FALL_SPEED = 2; // px per frame
  const MAX_MISSES = 5;

  // ----- State -----
  let paddleX = (W - PADDLE_W) / 2;
  // particle effects for catches
  const particles = [];
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  let paddleColor = COLORS[0];
  let circles = [];
  let lastSpawn = 0;
  let score = 0;
  let streak = 0;
  let misses = 0;
  let gameOver = false;

  // ----- Input -----
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    paddleX = e.clientX - rect.left - PADDLE_W / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > W - PADDLE_W) paddleX = W - PADDLE_W;
  });

  window.addEventListener('keydown', e => {
    const idx = parseInt(e.key) - 1;
    if (idx >= 0 && idx < COLORS.length) paddleColor = COLORS[idx];
  });

  // ----- Helpers -----
  function spawnCircle() {
    const x = Math.random() * (W - CIRCLE_R * 2) + CIRCLE_R;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    circles.push({ x, y: -CIRCLE_R, color });
  }

  function rectCircleCollision(px, py, pw, ph, cx, cy, cr) {
    // simple AABB vs circle test
    const closestX = Math.max(px, Math.min(cx, px + pw));
    const closestY = Math.max(py, Math.min(cy, py + ph));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  function update(delta) {
    if (gameOver) return;
    // spawn
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnCircle();
      lastSpawn = performance.now();
    }
    // move circles
    circles.forEach(c => (c.y += FALL_SPEED));
    // update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    // remove dead particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    // check collisions & misses
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      if (c.y - CIRCLE_R > H) {
        circles.splice(i, 1);
        misses++;
        streak = 0;
        // sound for miss
        playTone(150, 0.2);
        if (misses >= MAX_MISSES) endGame();
        continue;
      }
      if (rectCircleCollision(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, c.x, c.y, CIRCLE_R)) {
        circles.splice(i, 1);
if (c.color === paddleColor) {
          score++;
          streak++;
          // optional streak bonus
          if (streak % 5 === 0) score += 5;
          // sound for correct catch
          playTone(440, 0.1);
          // create spark particles
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              radius: 2 + Math.random() * 2,
              life: 30,
              color: c.color,
            });
          }
        } else {
          // sound for wrong color (game over)
          playTone(200, 0.3);
          endGame();
        }
        } else {
          endGame();
        }
      }
    }
  }

  function draw() {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // paddle with rounded corners and shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = paddleColor;
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(paddleX + radius, PADDLE_Y);
    ctx.lineTo(paddleX + PADDLE_W - radius, PADDLE_Y);
    ctx.quadraticCurveTo(paddleX + PADDLE_W, PADDLE_Y, paddleX + PADDLE_W, PADDLE_Y + radius);
    ctx.lineTo(paddleX + PADDLE_W, PADDLE_Y + PADDLE_H - radius);
    ctx.quadraticCurveTo(paddleX + PADDLE_W, PADDLE_Y + PADDLE_H, paddleX + PADDLE_W - radius, PADDLE_Y + PADDLE_H);
    ctx.lineTo(paddleX + radius, PADDLE_Y + PADDLE_H);
    ctx.quadraticCurveTo(paddleX, PADDLE_Y + PADDLE_H, paddleX, PADDLE_Y + PADDLE_H - radius);
    ctx.lineTo(paddleX, PADDLE_Y + radius);
    ctx.quadraticCurveTo(paddleX, PADDLE_Y, paddleX + radius, PADDLE_Y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // circles with radial gradient
    circles.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, CIRCLE_R * 0.2, c.x, c.y, CIRCLE_R);
      grad.addColorStop(0, 'white');
      grad.addColorStop(1, c.color);
      ctx.beginPath();
      ctx.arc(c.x, c.y, CIRCLE_R, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });
    // particles
    particles.forEach(p => {
      const alpha = Math.max(p.life / 30, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Misses: ${misses}/${MAX_MISSES}`, 10, 40);

  }

  function endGame() {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2 - 20);
    ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 20);
  }

  function loop() {
    const now = performance.now();
    update(now);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
