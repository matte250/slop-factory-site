// Neon Drift: simple canvas game
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 400;
  const center = { x: width / 2, y: height / 2 };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let musicOsc = null;
  function playTone(freq, length = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + length);
    osc.start(now);
    osc.stop(now + length);
  }
  function startMusic() {
    if (musicOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 30;
    osc.type = 'sine';
    gain.gain.value = 0.02;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    musicOsc = osc;
  }
  function stopMusic() {
    if (musicOsc) {
      musicOsc.stop();
      musicOsc = null;
    }
  }

  // Game config
  const PLAYER_SPEED = 3;
  const PLAYER_RADIUS = 6;
  const OBSTACLE_RADIUS = 8;
  const POWERUP_RADIUS = 5;
  const OBSTACLE_SPAWN_RATE = 1500; // ms
  const POWERUP_SPAWN_RATE = 8000; // ms
  const GAME_TIME = 45; // seconds

  // State
  let player = { x: center.x, y: center.y - 100, angle: 0 };
  let obstacles = [];
  let powerups = [];
  let particles = [];
  let keys = {};
  let score = 0;
  let remaining = GAME_TIME;
  let lastTick = performance.now();
  let lastObstacle = 0;
  let lastPowerup = 0;
  let timerId = null;
  let running = true;

  // Input handling with audio start
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    if (!audioStarted) {
      audioCtx.resume().then(() => {
        startMusic();
      });
      audioStarted = true;
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) / 2 + 20;
    obstacles.push({
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance,
      angle,
      speed: 1 + Math.random() * 1.5,
    });
  }

  function spawnPowerup() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) / 2 + 20;
    powerups.push({
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance,
      angle,
      speed: 1,
    });
  }

  function update(dt) {
    // player movement (rotate around center with arrow keys)
    if (keys.ArrowLeft) player.angle -= 0.03 * dt;
    if (keys.ArrowRight) player.angle += 0.03 * dt;
    if (keys.ArrowUp) {
      player.x += Math.cos(player.angle) * PLAYER_SPEED;
      player.y += Math.sin(player.angle) * PLAYER_SPEED;
    }
    if (keys.ArrowDown) {
      player.x -= Math.cos(player.angle) * PLAYER_SPEED;
      player.y -= Math.sin(player.angle) * PLAYER_SPEED;
    }

    // keep player within bounds - wrap to center if too far
    const dx = player.x - center.x;
    const dy = player.y - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist > Math.max(width, height) / 2) {
      player.x = center.x + dx * 0.9;
      player.y = center.y + dy * 0.9;
    }

    // obstacles move inward
    obstacles.forEach(o => {
      o.x -= Math.cos(o.angle) * o.speed;
      o.y -= Math.sin(o.angle) * o.speed;
    });
    // powerups move inward
    powerups.forEach(p => {
      p.x -= Math.cos(p.angle) * p.speed;
      p.y -= Math.sin(p.angle) * p.speed;
    });

    // spawn particle trail behind player
    particles.push({ x: player.x, y: player.y, alpha: 0.4 });
    // update particles fade
    particles = particles.filter(p => {
      p.alpha -= 0.02 * dt / 16; // fade over ~800ms
      return p.alpha > 0;
    });

    // collision detection
    obstacles = obstacles.filter(o => {
      const d = Math.hypot(o.x - player.x, o.y - player.y);
      if (d < PLAYER_RADIUS + OBSTACLE_RADIUS) {
        running = false; // game over
        playTone(120); // low pitch for crash
        stopMusic();
        return false;
      }
      // remove when off-screen
      const off = Math.hypot(o.x - center.x, o.y - center.y) < 10;
      return !off;
    });

    powerups = powerups.filter(p => {
      const d = Math.hypot(p.x - player.x, p.y - player.y);
      if (d < PLAYER_RADIUS + POWERUP_RADIUS) {
        score += 10;
        playTone(440); // high pitch for power‑up
        return false;
      }
      const off = Math.hypot(p.x - center.x, p.y - center.y) < 10;
      return !off;
    });

    // spawn timing
    const now = performance.now();
    if (now - lastObstacle > OBSTACLE_SPAWN_RATE) {
      spawnObstacle();
      lastObstacle = now;
    }
    if (now - lastPowerup > POWERUP_SPAWN_RATE) {
      spawnPowerup();
      lastPowerup = now;
    }
  }

  function draw() {
    // Neon gradient background
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // particles trail (neon fade)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
      ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // rotating arena (glowing neon circle)
    ctx.save();
    ctx.translate(center.x, center.y);
    const rotation = performance.now() / 2000;
    ctx.rotate(rotation);
    ctx.shadowColor = 'rgba(0,255,255,0.7)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(width, height) / 2 - 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // player dot with glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // obstacles with red neon glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, OBSTACLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // powerups with green neon glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#0f0';
    powerups.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, POWERUP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, Math.floor(remaining))}`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTick;
    lastTick = timestamp;
    if (running) {
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function startTimer() {
    timerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) running = false;
    }, 1000);
  }

  // init
  startTimer();
  requestAnimationFrame(loop);
})();
