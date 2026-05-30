// Minimalist Shadow Escape game
// Canvas with id="game"
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 400;

  const playerSize = 20;
  const player = { x: width / 2 - playerSize / 2, y: height / 2 - playerSize / 2, speed: 2 };

  const shadows = [
    { side: 'top', progress: 0 },
    { side: 'right', progress: 0 },
    { side: 'bottom', progress: 0 },
    { side: 'left', progress: 0 },
  ];
  const shadowSpeed = 0.5; // pixels per frame

  let lastMove = performance.now();
  const idleLimit = 5000; // ms
  let startTime = performance.now();
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => { if (audioCtx.state === 'suspended') audioCtx.resume(); keys[e.key] = true; lastMove = performance.now(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep inside bounds
    player.x = Math.max(0, Math.min(width - playerSize, player.x));
    player.y = Math.max(0, Math.min(height - playerSize, player.y));

    // expand shadows
    shadows.forEach(s => s.progress += shadowSpeed);

    // collision detection
    if (
      player.x < shadows[3].progress ||
      player.y < shadows[0].progress ||
      player.x + playerSize > width - shadows[1].progress ||
      player.y + playerSize > height - shadows[2].progress
    ) {
      if (!gameOver) playBeep();
      gameOver = true;
    }

    // idle detection
    if (performance.now() - lastMove > idleLimit) gameOver = true;
  }

  function draw() {
    // background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    // draw shadows with gradient opacity
    const maxAlpha = 0.8;
    // top
    let grad = ctx.createLinearGradient(0, 0, 0, shadows[0].progress);
    grad.addColorStop(0, `rgba(0,0,0,${maxAlpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, shadows[0].progress);
    // right
    grad = ctx.createLinearGradient(width - shadows[1].progress, 0, width, 0);
    grad.addColorStop(0, `rgba(0,0,0,${maxAlpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(width - shadows[1].progress, 0, shadows[1].progress, height);
    // bottom
    grad = ctx.createLinearGradient(0, height - shadows[2].progress, 0, height);
    grad.addColorStop(0, `rgba(0,0,0,${maxAlpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - shadows[2].progress, width, shadows[2].progress);
    // left
    grad = ctx.createLinearGradient(0, 0, shadows[3].progress, 0);
    grad.addColorStop(0, `rgba(0,0,0,${maxAlpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, shadows[3].progress, height);
    // player as glowing circle
    const cx = player.x + playerSize / 2;
    const cy = player.y + playerSize / 2;
    const radius = playerSize / 2;
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2);
    glow.addColorStop(0, '#0f0');
    glow.addColorStop(1, 'rgba(0,255,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    // score with crisp font
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    const score = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${score}s`, 10, 24);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '36px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Game Over', width / 2 - 90, height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
