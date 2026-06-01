// Simple Neon Trail Escape game
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function beep(freq, duration = 100) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Set canvas size (fallback to 800x600 if not set via CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = {
    trail: [], // recent positions for trail effect
    x: canvas.width / 2,
    y: canvas.height - 60,
    r: 15,
    speed: 5,
    color: '#0ff',
  };

  let obstacles = [];
  let lastObs = 0;
  const obsInterval = 1500; // ms
  let score = 0;
  let prevScore = 0;
  let startTime = performance.now();
  let gameOver = false;
  let bgOffset = 0; // for animated grid
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
        if (!keys[e.key]) beep(300); // beep on new key press
        keys[e.key] = true;
    }
});
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, clickX));
  });

  function spawnObstacle() {
    const width = 80 + Math.random() * 120;
    const x = Math.random() * (canvas.width - width);
    const speed = 2 + Math.random() * 2 + score / 1000; // increase with score
    obstacles.push({ x, y: -30, w: width, h: 20, speed });
    beep(250, 80); // obstacle spawn sound
  }

  function update(dt) {
  // add current position to trail
  player.trail.push({x: player.x, y: player.y});
  if (player.trail.length > 15) player.trail.shift();
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));

    // obstacles
    obstacles.forEach(o => o.y += o.speed);
    obstacles = obstacles.filter(o => o.y < canvas.height + o.h);

    // generate new obstacles
    if (performance.now() - lastObs > obsInterval) {
      spawnObstacle();
      lastObs = performance.now();
    }

    // collision detection (circle-rect)
    for (const o of obstacles) {
      const cx = player.x, cy = player.y;
      const nearestX = Math.max(o.x, Math.min(cx, o.x + o.w));
      const nearestY = Math.max(o.y, Math.min(cy, o.y + o.h));
      const dx = cx - nearestX, dy = cy - nearestY;
      if (dx * dx + dy * dy < player.r * player.r) {
        beep(100, 300); // collision sound
        gameOver = true;
        break;
      }
    }

    // score as time survived
    score = Math.floor((performance.now() - startTime) / 100);
  }

  // helper to draw rounded rectangle with optional glow
function drawRoundedRect(x, y, w, h, radius, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
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
  ctx.shadowColor = fillStyle;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

function drawBackground(offset) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#020202');
  grad.addColorStop(1, '#001a33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(0,255,255,0.1)';
  const spacing = 40;
  // animated vertical lines
  for (let x = (offset % spacing); x < canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  // horizontal lines
  for (let y = 0; y < canvas.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function draw() {
  // clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // animate background grid with gradient
  bgOffset += 0.5;
  drawBackground(bgOffset);

  // draw obstacles with neon glow
  obstacles.forEach(o => {
    const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
    grad.addColorStop(0, 'rgba(255,0,255,0.7)');
    grad.addColorStop(1, 'rgba(255,0,255,0.3)');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  });

  // draw player trail (fading neon)
  ctx.globalCompositeOperation = 'lighter';
  player.trail.forEach((p, i) => {
    const alpha = i / player.trail.length;
    const size = player.r * (0.5 + 0.5 * alpha);
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
    grad.addColorStop(0, `rgba(0,255,255,${0.2 + 0.3 * alpha})`);
    grad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';

  // draw player orb
  const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r);
  grad.addColorStop(0, player.color);
  grad.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // score display
  ctx.fillStyle = '#0ff';
  ctx.font = '20px monospace';
  ctx.fillText('Score: ' + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f44';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastFrame || timestamp);
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
