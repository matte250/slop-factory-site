// Minimal endless runner with enhanced neon graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 400);

  // Player (neon square)
  const player = {x: 50, y: H - 50, w: 30, h: 30, vy: 0, jumpForce: -12, onGround: true};

  // Game state
  let obstacles = [];
  let frames = 0;
  let score = 0;

  const GRAVITY = 0.6;
  const SPEED = 4;

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    obstacles.push({x: W, y: H - size, w: size, h: size});
  };

  const update = () => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) { // ground
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // Obstacles move
    obstacles.forEach(o => o.x -= SPEED);
    // Remove passed obstacles & increase score
    obstacles = obstacles.filter(o => {
      if (o.x + o.w < 0) { score++; return false; }
      return true;
    });
    // Collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // Game over – reset with sound
        playBeep(150, 0.3); // low beep for crash
        obstacles = [];
        score = 0;
        player.y = H - player.h;
        player.vy = 0;
        break;
      }
    }
    // Random spawn
    if (frames % 90 === 0) spawnObstacle();
    frames++;
  };

  // Helper to draw rounded rectangles
const drawRoundedRect = (x, y, w, h, r, style) => {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
};

const draw = () => {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Neon glow settings
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;

    // Neon player with rounded corners
    drawRoundedRect(player.x, player.y, player.w, player.h, 6, '#0ff');

    // Reset shadow for obstacles (red glow)
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 12;
    obstacles.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 4, '#f00'));

    // Score text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Audio helper
  let audioCtx;
  const initAudio = () => { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); };
  const playBeep = (freq, dur) => { initAudio(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.frequency.value = freq; osc.type = 'sine'; osc.connect(gain); gain.connect(audioCtx.destination); gain.gain.setValueAtTime(0.001, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01); osc.start(); osc.stop(audioCtx.currentTime + dur); };

  // Input
  const jump = () => {
    if (player.onGround) { player.vy = player.jumpForce; player.onGround = false; playBeep(440, 0.1); }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, {passive:false});

  // Start
  loop();
})();
