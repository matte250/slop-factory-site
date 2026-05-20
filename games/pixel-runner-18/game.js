// Minimal Pixel Runner game implementation
// Canvas element with id="game" must exist in the HTML.

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }

  // Game state
  const player = { x: 50, y: height / 2, size: 20, dy: 0 };
  const gravity = 0.5;
  const jumpStrength = -8;
  const speed = 3; // forward speed (scroll speed of obstacles)
  const stars = [];
  const blocks = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnStar() {
    stars.push({ x: width, y: Math.random() * (height - 10), size: 5 });
  }
  function spawnBlock() {
    const blockHeight = 30 + Math.random() * 50;
    const y = Math.random() * (height - blockHeight);
    blocks.push({ x: width, y, width: 30, height: blockHeight });
  }

  // Random spawn timers
  let starTimer = 0, blockTimer = 0;

  function update() {
    if (gameOver) return;
    // Player vertical movement
    if (keys['ArrowUp'] || keys['w']) { player.dy = jumpStrength; playTone(300, 0.1); }
    else if (keys['ArrowDown'] || keys['s']) player.dy = jumpStrength / 2; // gentle down press
    else player.dy += gravity;
    player.y += player.dy;
    // Keep player within canvas
    if (player.y < 0) player.y = 0, player.dy = 0;
    if (player.y + player.size > height) player.y = height - player.size, player.dy = 0;

    // Move stars and blocks leftward
    stars.forEach(s => s.x -= speed);
    blocks.forEach(b => b.x -= speed);
    // Remove off‑screen objects
    while (stars.length && stars[0].x < -stars[0].size) stars.shift();
    while (blocks.length && blocks[0].x < -blocks[0].width) blocks.shift();

    // Collision detection with blocks
    for (const b of blocks) {
      if (
        player.x < b.x + b.width &&
        player.x + player.size > b.x &&
        player.y < b.y + b.height &&
        player.y + player.size > b.y
      ) { gameOver = true; playTone(200, 0.2); break; }
    }

    // Collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = (player.x + player.size / 2) - (s.x + s.size / 2);
      const dy = (player.y + player.size / 2) - (s.y + s.size / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < player.size / 2 + s.size) { score++; playTone(600, 0.05); stars.splice(i, 1); }
    }

    // Random spawning
    if (starTimer-- <= 0) { spawnStar(); starTimer = 60 + Math.random() * 60; }
    if (blockTimer-- <= 0) { spawnBlock(); blockTimer = 90 + Math.random() * 120; }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#1e90ff'); // deeper blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Helper for rounded rectangles
    function roundedRect(x, y, w, h, r) {
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
    }

    // Draw player as a glowing circle
    const playerGrad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 4,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    playerGrad.addColorStop(0, '#a0ffa0');
    playerGrad.addColorStop(1, '#00aa00');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw stars as sparkling circles with radial gradient
    stars.forEach(s => {
      const starGrad = ctx.createRadialGradient(
        s.x + s.size / 2,
        s.y + s.size / 2,
        0,
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size / 2
      );
      starGrad.addColorStop(0, '#fff');
      starGrad.addColorStop(1, '#ff0');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw blocks with rounded corners and gradient
    blocks.forEach(b => {
      const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
      blockGrad.addColorStop(0, '#ff4d4d');
      blockGrad.addColorStop(1, '#b30000');
      ctx.fillStyle = blockGrad;
      roundedRect(b.x, b.y, b.width, b.height, 4);
      ctx.fill();
    });

    // Draw score with shadow for readability
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.shadowBlur = 0; // reset shadow

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
