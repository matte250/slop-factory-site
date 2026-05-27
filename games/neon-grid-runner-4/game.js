// Simple Neon Grid Runner - Enhanced graphics
// Canvas element with id="game"
window.addEventListener('load', () => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBoost() { playBeep(800, 0.1); }
  function playCollision() { playBeep(200, 0.3); }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: width / 2, y: height - 80, w: 40, h: 20, speed: 4 };
  const obstacles = [];
  const boosts = [];
  const particles = [];
  let tick = 0;
  let score = 0;
  const highScoreKey = 'neon-grid-highscore';
  let highScore = parseInt(localStorage.getItem(highScoreKey)) || 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }
  function spawnBoost() {
    const size = 20;
    boosts.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2, collected: false });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn obstacles/boosts periodically
    if (tick % 90 === 0) spawnObstacle();
    if (tick % 300 === 0) spawnBoost();

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i, 1);
      // Collision with ship
      if (!gameOver && o.x < ship.x + ship.w && o.x + o.w > ship.x && o.y < ship.y + ship.h && o.y + o.h > ship.y) {
        playCollision();
        gameOver = true;
      }
    }
    // ship trail particles
    particles.push({ x: ship.x + ship.w / 2, y: ship.y + ship.h, alpha: 1, size: 6 });
    // fade particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.alpha -= 0.03;
      p.y -= 0.5; // rise
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Update boosts
    for (let i = boosts.length - 1; i >= 0; i--) {
      const b = boosts[i];
      b.y += b.speed;
      if (b.y > height) boosts.splice(i, 1);
      if (!b.collected && b.x < ship.x + ship.w && b.x + b.w > ship.x && b.y < ship.y + ship.h && b.y + b.h > ship.y) {
        b.collected = true;
        score += 50;
        ship.speed += 0.5; // increase speed slightly
        boosts.splice(i, 1);
        playBoost();
      }
    }

    // Increment score over time
    score += 0.1;
    tick++;
  }

function drawGrid() {
  // neon grid with bright glow
  ctx.strokeStyle = '#0ff6';
  ctx.lineWidth = 0.5;
  ctx.shadowColor = '#0ff8';
  ctx.shadowBlur = 6;
  const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

function render() {
  // clear and draw background gradient
  ctx.clearRect(0, 0, width, height);
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // draw neon grid
  drawGrid();

  // draw particle trail
  particles.forEach(p => {
    ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // ship (neon triangle with glow)
  ctx.fillStyle = '#0ff';
  ctx.shadowColor = '#0ff8';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // obstacles (neon squares with glow)
  ctx.fillStyle = '#f00';
  ctx.shadowColor = '#f008';
  ctx.shadowBlur = 12;
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
  ctx.shadowBlur = 0;

  // boosts (glowing circles with radial gradient)
  boosts.forEach(b => {
    const grad = ctx.createRadialGradient(
      b.x + b.w / 2,
      b.y + b.h / 2,
      0,
      b.x + b.w / 2,
      b.y + b.h / 2,
      b.w / 2
    );
    grad.addColorStop(0, '#ff0');
    grad.addColorStop(1, '#ff0080');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // scores
  ctx.fillStyle = '#0ff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  ctx.fillText('High: ' + Math.max(highScore, Math.floor(score)), 10, 40);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 2);
  }
}

  function loop() {
    update();
    render();
    if (gameOver) {
      if (score > highScore) {
        localStorage.setItem(highScoreKey, Math.floor(score));
      }
      return;
    }
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
});
