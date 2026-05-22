// Simple Neon Runner game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.stop(now + duration);
  }
  function playBoost() { playTone(440, 0.1); }
  function playCollect() { playTone(660, 0.1); }
  function playCrash() { playTone(220, 0.3); }

  // ----- Game constants -----
  const FPS = 60;
  const PLAYER_SPEED = 3; // base lateral speed
  const BOOST_SPEED = 6;
  const OBSTACLE_SPEED = 4; // scroll speed (downwards)
  const SPAWN_INTERVAL = 1200; // ms
  const ENERGY_DEPLETION = 0.02; // per frame
  const ENERGY_RECHARGE = 0.3; // per core
  const MAX_ENERGY = 100;

  // ----- State -----
  const player = {
    x: width / 2,
    y: height - 80,
    w: 40,
    h: 60,
    color: '#0ff',
    energy: MAX_ENERGY,
    boosting: false,
  };

  const obstacles = [];
  const cores = [];
  let keys = {};
  let score = 0;
  let lastSpawn = 0;

  // ----- Input -----
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    audioCtx.resume();
    keys[e.key] = true;
    if (e.key === 'ArrowUp' || e.key === 'w') playBoost();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helper functions -----
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnObstacle() {
    const w = 50 + Math.random() * 80;
    const h = 20 + Math.random() * 30;
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -h, w, h, color: '#f0f' });
  }

  function spawnCore() {
    const size = 20;
    const x = Math.random() * (width - size);
    cores.push({ x, y: -size, w: size, h: size, color: '#ff0' });
  }

  // ----- Main loop -----
  function update(dt) {
    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= PLAYER_SPEED;
    if (keys['ArrowRight'] || keys['d']) player.x += PLAYER_SPEED;
    if (keys['ArrowUp'] || keys['w']) player.boosting = true; else player.boosting = false;
    if (player.boosting && player.energy > 0) {
      player.x += (keys['ArrowRight'] ? BOOST_SPEED : 0) - (keys['ArrowLeft'] ? BOOST_SPEED : 0);
      player.energy = Math.max(0, player.energy - ENERGY_DEPLETION * 2);
    }
    // keep inside canvas
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Energy drain over time
    player.energy = Math.max(0, player.energy - ENERGY_DEPLETION);

    // Move obstacles and cores
    const speed = OBSTACLE_SPEED + (player.boosting ? 2 : 0);
    obstacles.forEach(o => (o.y += speed));
    cores.forEach(c => (c.y += speed));

    // Remove off‑screen
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();
    while (cores.length && cores[0].y > height) cores.shift();

    // Collision detection
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (rectIntersect(player, obstacles[i])) {
        // Lose condition
        gameOver();
        return;
      }
    }
    for (let i = cores.length - 1; i >= 0; i--) {
      if (rectIntersect(player, cores[i])) {
        player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_RECHARGE);
        score += 10;
        cores.splice(i, 1);
        playCollect();
      }
    }

    // Energy loss -> lose
    if (player.energy <= 0) {
      gameOver();
      return;
    }

    // Spawning
    if (Date.now() - lastSpawn > SPAWN_INTERVAL) {
      if (Math.random() < 0.7) spawnObstacle(); else spawnCore();
      lastSpawn = Date.now();
    }
  }

  function draw() {
    // Neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Optional subtle grid lines for depth
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Player ship with neon glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw obstacles with rounded neon rectangles
    obstacles.forEach(o => {
      ctx.save();
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = o.color;
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.w - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      ctx.lineTo(o.x + o.w, o.y + o.h - radius);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      ctx.lineTo(o.x + radius, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Energy cores with radial glow
    cores.forEach(c => {
      const grad = ctx.createRadialGradient(
        c.x + c.w / 2,
        c.y + c.h / 2,
        2,
        c.x + c.w / 2,
        c.y + c.h / 2,
        c.w / 2
      );
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 10;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Energy bar (glow effect)
    const barWidth = 150;
    const barHeight = 10;
    const barX = 10;
    const barY = 10;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#0f0';
    ctx.fillRect(barX, barY, (player.energy / MAX_ENERGY) * barWidth, barHeight);
    ctx.restore();

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Arial", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, width - 100, 10);
  }

  let running = true;
  function gameOver() {
    // Play crash sound
    playCrash();
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f44';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, width / 2, height / 2 + 40);
  }

  function loop(timestamp) {
    if (!running) return;
    update(1000 / FPS);
    draw();
    requestAnimationFrame(loop);
  }

  // Start loop
  requestAnimationFrame(loop);
})();
