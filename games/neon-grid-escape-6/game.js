// Neon Grid Escape – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  // Player
  const player = {
    x: width / 2,
    y: height - 60,
    radius: 8,
    speed: 4,
    color: '#00ffcc',
    vx: 0,
    vy: 0,
  };

  // Obstacles
  const obstacles = [];
  const obstacleFrequency = 1500; // ms
  const obstacleSpeed = 2;
  let lastObstacleTime = 0;

  // Score
  let startTime = null;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Stars background
  const stars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
      });
    }
  }
  initStars();

  function drawStars() {
    ctx.fillStyle = '#444';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Background gradient
  function drawBackground() {
    const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    grad.addColorStop(0, '#001a1a');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Neon grid
  let gridOffset = 0;
  const gridSpeed = 0.3;
  function drawGrid() {
    const gridSize = 40;
    gridOffset = (gridOffset + gridSpeed) % gridSize;
    ctx.strokeStyle = 'rgba(0,255,200,0.3)';
    ctx.lineWidth = 1;
    for (let x = -gridOffset; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = -gridOffset; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Obstacle rendering with neon glow
  function drawObstacle(o) {
    ctx.fillStyle = o.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  }

  // Particle trail
  const particles = [];
  function updateParticles(dt) {
    particles.push({ x: player.x, y: player.y, age: 0, life: 400 });
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    for (const p of particles) {
      const alpha = 1 - p.age / p.life;
      ctx.fillStyle = `rgba(0,255,200,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

function spawnObstacle() {
  const w = 30 + Math.random() * 70;
  const h = 10 + Math.random() * 30;
  const x = Math.random() * (width - w);
  obstacles.push({ x, y: -h, w, h, color: '#ff3366' });
  // Play a short zap sound for new obstacle
  playSound(220, 'sawtooth', 0.07);
}

  function update(dt) {
    if (gameOver) return;
    // Player movement
    player.vx = player.vy = 0;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;
    if (keys.ArrowUp) player.vy = -player.speed;
    if (keys.ArrowDown) player.vy = player.speed;
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x + player.vx));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y + player.vy));

    // Spawn obstacles
    if (performance.now() - lastObstacleTime > obstacleFrequency) {
      spawnObstacle();
      lastObstacleTime = performance.now();
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      if (o.y > height) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      const dx = Math.max(o.x - player.x, 0, player.x - (o.x + o.w));
      const dy = Math.max(o.y - player.y, 0, player.y - (o.y + o.h));
      if (dx * dx + dy * dy < player.radius * player.radius) {
        gameOver = true;
        // Play collision sound
        playSound(100, 'triangle', 0.3);
        break;
      }
    }

    // Particle trail
    updateParticles(dt);

    // Score
    if (!startTime) startTime = performance.now();
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawStars();
    drawGrid();
    for (const o of obstacles) drawObstacle(o);
    drawParticles();
    // Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Score
    ctx.fillStyle = '#00ffcc';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff3366';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
