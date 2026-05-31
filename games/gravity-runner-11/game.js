// Gravity Runner – minimal implementation
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  function ensureAudioResume() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  function gameOverSound(){
    ensureAudioResume();
    playTone(150, 0.3);
  }
  const W = canvas.width = canvas.width || 800;
  const H = canvas.height = canvas.height || 400;

  // Player constants
  const PLAYER_W = 30, PLAYER_H = 30;
  const PLAYER_X = 50;
  const JUMP_V = -12; // speed when jumping (relative to gravity direction)
  const GRAVITY = 0.6;

  // Game state
  let gravityDir = 1; // 1 = down, -1 = up
  let playerY = gravityDir === 1 ? H - PLAYER_H : 0;
  let vy = 0;
  let obstacles = [];
  let lastSpawn = 0;
  let running = true;

  // Input – space toggles gravity and gives an impulse
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      ensureAudioResume();
      playTone(660, 0.15); // jump / gravity toggle sound
      gravityDir *= -1; // flip gravity
      vy = JUMP_V * gravityDir; // give a small push
    }
  });

  function spawnObstacle() {
    const height = 30 + Math.random() * 40;
    const y = gravityDir === 1 ? H - height : 0; // attach to floor/ceiling
    obstacles.push({ x: W, y, w: 20, h: height });
  }

  function update(dt) {
    // player physics
    vy += GRAVITY * gravityDir;
    playerY += vy;
    // keep player attached to floor/ceiling when not jumping
    if (gravityDir === 1) {
      if (playerY > H - PLAYER_H) { playerY = H - PLAYER_H; vy = 0; }
    } else {
      if (playerY < 0) { playerY = 0; vy = 0; }
    }
    // obstacles movement
    obstacles.forEach(o => o.x -= 4);
    // remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // spawn new obstacles
    if (performance.now() - lastSpawn > 1500) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
    // collision detection
    for (const o of obstacles) {
      if (PLAYER_X < o.x + o.w && PLAYER_X + PLAYER_W > o.x &&
          playerY < o.y + o.h && playerY + PLAYER_H > o.y) {
        running = false; // game over
        gameOverSound();
        break;
      }
    }
    // fall off screen detection (optional)
    if (playerY > H || playerY + PLAYER_H < 0) running = false;
  }

  function draw() {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#81d4fa'); // light blue top
    bgGrad.addColorStop(1, '#0288d1'); // dark blue bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // draw player as a circle with gradient
    const playerGrad = ctx.createRadialGradient(
      PLAYER_X + PLAYER_W / 2,
      playerY + PLAYER_H / 2,
      5,
      PLAYER_X + PLAYER_W / 2,
      playerY + PLAYER_H / 2,
      PLAYER_W / 2
    );
    playerGrad.addColorStop(0, '#ff8a65');
    playerGrad.addColorStop(1, '#d84315');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(PLAYER_X + PLAYER_W / 2, playerY + PLAYER_H / 2, PLAYER_W / 2, 0, Math.PI * 2);
    ctx.fill();
    // draw obstacles with gradient and rounded corners
    const obsGrad = ctx.createLinearGradient(0, 0, 0, H);
    obsGrad.addColorStop(0, '#90a4ae');
    obsGrad.addColorStop(1, '#37474f');
    ctx.fillStyle = obsGrad;
    obstacles.forEach(o => {
      const radius = 5;
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
    });
    // simple game‑over text
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  loop();
})();
