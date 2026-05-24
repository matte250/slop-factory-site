// Simple top‑down game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // generate simple starfield background
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function ensureAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }
  window.addEventListener('keydown', ensureAudio);
  window.addEventListener('click', ensureAudio);
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Background ambience (soft drone)
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 40;
  bgOsc.type = 'sine';
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  bgGain.gain.exponentialRampToValueAtTime(0.02, audioCtx.currentTime + 2);
  bgOsc.start();

  // Game config
  const TARGET_SCORE = 10;
  const TIME_LIMIT = 60; // seconds
  const PLAYER_SPEED = 200; // pixels per second
  const CRYSTAL_RADIUS = 8;
  const ALIEN_SIZE = 20;
  const SPAWN_CRYSTAL_INTERVAL = 2000; // ms
  const SPAWN_ALIEN_INTERVAL = 3000; // ms

  // State
  let player = { x: width / 2, y: height / 2, size: 12, angle: 0 };
  let crystals = [];
  let aliens = [];
  let keys = {};
  let score = 0;
  let timeLeft = TIME_LIMIT;
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  // Helper functions
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rectCircleCollide = (rect, circle) => {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.size));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.size));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy < circle.r * circle.r;
  };
  const trianglePath = (x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
  };

  // Spawning
  const spawnCrystal = () => {
    const x = Math.random() * (width - CRYSTAL_RADIUS * 2) + CRYSTAL_RADIUS;
    const y = Math.random() * (height - CRYSTAL_RADIUS * 2) + CRYSTAL_RADIUS;
    crystals.push({ x, y, r: CRYSTAL_RADIUS });
  };
  const spawnAlien = () => {
    const x = Math.random() * (width - ALIEN_SIZE);
    const y = Math.random() * (height - ALIEN_SIZE);
    const vx = (Math.random() - 0.5) * 100;
    const vy = (Math.random() - 0.5) * 100;
    aliens.push({ x, y, size: ALIEN_SIZE, vx, vy });
  };

  // Timers for spawning
  setInterval(spawnCrystal, SPAWN_CRYSTAL_INTERVAL);
  setInterval(spawnAlien, SPAWN_ALIEN_INTERVAL);

  // Main loop
  function update(dt) {
    if (gameOver) return;
    // Move player
    const dir = { x: 0, y: 0 };
    if (keys['arrowup'] || keys['w']) dir.y -= 1;
    if (keys['arrowdown'] || keys['s']) dir.y += 1;
    if (keys['arrowleft'] || keys['a']) dir.x -= 1;
    if (keys['arrowright'] || keys['d']) dir.x += 1;
    const len = Math.hypot(dir.x, dir.y);
    if (len) {
      player.x += (dir.x / len) * PLAYER_SPEED * dt;
      player.y += (dir.y / len) * PLAYER_SPEED * dt;
    }
    // Keep inside bounds
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));

    // Move aliens
    aliens.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // bounce
      if (a.x < 0 || a.x + a.size > width) a.vx *= -1;
      if (a.y < 0 || a.y + a.size > height) a.vy *= -1;
    });

    // Check collisions with crystals
    crystals = crystals.filter(c => {
if (dist(player, c) < player.size + c.r) {
          score++;
          playTone(600, 0.1);
          return false;
        }
      return true;
    });

    // Check collisions with aliens
    for (let a of aliens) {
      if (rectCircleCollide({ x: a.x, y: a.y, size: a.size }, { x: player.x, y: player.y, r: player.size })) {
        gameOver = true;
        playTone(200, 0.3); // collision sound
        break;
      }
    }

    // Timer
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      gameOver = true;
    }
    if (score >= TARGET_SCORE) {
      gameOver = true;
    }
  }

  function draw() {
// Background
    ctx.fillStyle = '#001022';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.globalAlpha = 0.5 + 0.5 * Math.random();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Player ship (triangle) with outline and slight rotation
    const angle = Math.atan2((keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0), (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0));
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle);
    ctx.fillStyle = 'white';
    trianglePath(0, 0, player.size);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // Crystals (glowing circles with pulse)
    crystals.forEach(c => {
      const pulse = Math.abs(Math.sin(performance.now() / 200 + c.x + c.y));
      const grad = ctx.createRadialGradient(c.x, c.y, c.r / 4, c.x, c.y, c.r);
      grad.addColorStop(0, `rgba(170,255,255,${0.7 + 0.3 * pulse})`);
      grad.addColorStop(1, `rgba(0,170,255,${0.5 + 0.5 * pulse})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Aliens (red rounded squares with gradient)
    aliens.forEach(a => {
      const grad = ctx.createLinearGradient(a.x, a.y, a.x + a.size, a.y + a.size);
      grad.addColorStop(0, '#ff4444');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.fillRect(a.x, a.y, a.size, a.size);
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}/${TARGET_SCORE}`, 10, 20);
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      const msg = score >= TARGET_SCORE ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, width / 2, height / 2);
    }
  }

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
