// Minimal canvas game based on IDEA.md
// Player: a square at the bottom, moves left/right with Arrow keys.
// Blocks: falling rectangles that speed up over time.
// Score: survival time displayed on top-left.
// Improved graphics: rounded shapes, gradients, simple starfield background.

(() => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  function playCollisionSound() {
    playTone(150, 0.4);
  }

  function playSpawnSound() {
    playTone(400, 0.1);
  }

  // Ensure audio context resumes on user interaction (required by browsers)
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  }
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  // ... rest of code unchanged
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player configuration
  const player = {
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 35,
    speed: 5,
  };

  // Block configuration
  const blocks = [];
  let blockInterval = 1500; // ms between spawns
  let lastSpawn = 0;
  let fallSpeed = 2; // initial fall speed
  const speedIncrease = 0.05; // per second
  // Starfield setup
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
    });
  }

  // Input handling
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  let startTime = performance.now();
  let gameOver = false;

  function spawnBlock() {
    const size = 20 + Math.random() * 30; // random size 20-50
    const x = Math.random() * (width - size);
    const block = { x, y: -size, w: size, h: size };
    blocks.push(block);
    playSpawnSound();
  }

  function update(dt) {
    // Move player
    if (keys.left) player.x = Math.max(0, player.x - player.speed);
    if (keys.right) player.x = Math.min(width - player.w, player.x + player.speed);

    // Spawn blocks
    if (performance.now() - lastSpawn > blockInterval) {
      spawnBlock();
      lastSpawn = performance.now();
      // gradually speed up spawning
      blockInterval = Math.max(300, blockInterval - 20);
    }

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += fallSpeed;
      // Remove off‑screen blocks
      if (b.y > height) blocks.splice(i, 1);
      // Collision detection
      if (
        b.x < player.x + player.w &&
        b.x + b.w > player.x &&
        b.y < player.y + player.h &&
        b.y + b.h > player.y
      ) {
        playCollisionSound();
        gameOver = true;
      }
    }
    // Increase falling speed over time
    const elapsedSec = (performance.now() - startTime) / 1000;
    fallSpeed = 2 + elapsedSec * speedIncrease;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (simple static stars)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player with rounded rectangle and slight shadow
    ctx.fillStyle = '#0a84ff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    drawRoundedRect(player.x, player.y, player.w, player.h, 6);
    ctx.shadowColor = 'transparent';

    // Blocks as rounded rectangles with gradient fill
    blocks.forEach(b => {
      const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      blockGrad.addColorStop(0, '#ff6b6b');
      blockGrad.addColorStop(1, '#c0392b');
      ctx.fillStyle = blockGrad;
      drawRoundedRect(b.x, b.y, b.w, b.h, 4);
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const score = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${score}s`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.textAlign = 'start';
    }
  }

  // Helper to draw rounded rectangles
  function drawRoundedRect(x, y, w, h, r) {
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
    ctx.fill();
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
