// Canvas Escape – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  // Set canvas size (could be styled via CSS, default to 400x400)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 400;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let bgOsc = null;

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  function startBackground() {
    if (bgOsc) return;
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 30; // low hum
    bgOsc.type = 'sine';
    bgOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    bgOsc.start();
  }

  function stopBackground() {
    if (bgOsc) {
      bgOsc.stop();
      bgOsc.disconnect();
      bgOsc = null;
    }
  }

  // Graphic constants
  const PLAYER_SIZE = 20;
  const PLAYER_SPEED = 3;
  const OBSTACLE_COUNT = 8;
  const OBSTACLE_MIN_SPEED = 1;
  const OBSTACLE_MAX_SPEED = 2.5;
  const GAME_TIME = 60; // seconds

  // Helper for rounded rect
  function drawRoundedRect(x, y, w, h, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  let player = { x: canvas.width / 2 - PLAYER_SIZE / 2, y: canvas.height / 2 - PLAYER_SIZE / 2 };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

  const obstacles = [];
  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    const radius = 15 + Math.random() * 10;
    obstacles.push({
      x: Math.random() * (canvas.width - 2 * radius) + radius,
      y: Math.random() * (canvas.height - 2 * radius) + radius,
      r: radius,
      vx: (Math.random() * 2 - 1) * (OBSTACLE_MIN_SPEED + Math.random() * (OBSTACLE_MAX_SPEED - OBSTACLE_MIN_SPEED)),
      vy: (Math.random() * 2 - 1) * (OBSTACLE_MIN_SPEED + Math.random() * (OBSTACLE_MAX_SPEED - OBSTACLE_MIN_SPEED)),
    });
  }

  let remaining = GAME_TIME;
  let lastTime = performance.now();
  let gameOver = false;
  let audioStarted = false;

  function update(dt) {
    // player movement
    if (keys.ArrowUp) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown) player.y += PLAYER_SPEED;
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED;
    if (keys.ArrowRight) player.x += PLAYER_SPEED;
    // keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - PLAYER_SIZE, player.x));
    player.y = Math.max(0, Math.min(canvas.height - PLAYER_SIZE, player.y));

    // obstacles move
    obstacles.forEach(o => {
      o.x += o.vx;
      o.y += o.vy;
      // bounce off walls
      if (o.x - o.r < 0 || o.x + o.r > canvas.width) o.vx = -o.vx;
      if (o.y - o.r < 0 || o.y + o.r > canvas.height) o.vy = -o.vy;
    });

    // collision detection
    for (const o of obstacles) {
      const cx = player.x + PLAYER_SIZE / 2;
      const cy = player.y + PLAYER_SIZE / 2;
      const distSq = (cx - o.x) ** 2 + (cy - o.y) ** 2;
      const radSum = o.r + PLAYER_SIZE / 2;
      if (distSq < radSum * radSum) {
        gameOver = true;
        playTone(400, 0.2); // collision sound
        stopBackground();
        return;
      }
    }

    // timer
    remaining -= dt / 1000;
    if (remaining <= 0) {
      remaining = 0;
      gameOver = true;
      playTone(150, 0.3); // time up sound
      stopBackground();
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw player with radial gradient and rounded corners
    const px = player.x + PLAYER_SIZE / 2;
    const py = player.y + PLAYER_SIZE / 2;
    const playerGrad = ctx.createRadialGradient(px, py, 0, px, py, PLAYER_SIZE / 2);
    playerGrad.addColorStop(0, '#4a90e2');
    playerGrad.addColorStop(1, '#0033ff');
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    drawRoundedRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, 4, playerGrad);
    ctx.shadowBlur = 0; // reset for other drawings

    // obstacles with radial gradients
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#ff7f7f');
      grad.addColorStop(1, '#ff1a1a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // timer text
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Time: ${Math.ceil(remaining)}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fffa';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input listeners
  window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; if (!audioStarted) { audioCtx.resume().then(startBackground); audioStarted = true; } });
  window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

  requestAnimationFrame(loop);
})();
