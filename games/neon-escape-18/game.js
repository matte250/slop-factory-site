// Game script for Neon Escape
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill parent or fixed size
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  // Audio context for simple synth sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio starts after user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // quick ramp for click‑like sound
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 15,
    speed: 5,
    color: '#00ffff', // neon cyan
  };

  const blocks = [];
  const blockSize = { w: 60, h: 20 };
  const blockSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  function spawnBlock() {
    const x = Math.random() * (canvas.width - blockSize.w);
    const y = -blockSize.h;
    const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    const speed = 2 + Math.random() * 2;
    blocks.push({ x, y, w: blockSize.w, h: blockSize.h, color, speed });
    // play a short beep when a block appears
    playTone(250, 0.08);
  }

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));

    // Move blocks down (simulating player moving up)
    for (const b of blocks) {
      b.y += b.speed;
    }
    // Remove off‑screen blocks
    while (blocks.length && blocks[0].y > canvas.height) blocks.shift();

    // Spawn new blocks
    if (performance.now() - lastSpawn > blockSpawnInterval) {
      spawnBlock();
      lastSpawn = performance.now();
    }

    // Collision detection (circle vs rectangle)
    for (const b of blocks) {
      const distX = Math.abs(player.x - (b.x + b.w / 2));
      const distY = Math.abs(player.y - (b.y + b.h / 2));
      if (distX > b.w / 2 + player.radius) continue;
      if (distY > b.h / 2 + player.radius) continue;
      if (distX <= b.w / 2 || distY <= b.h / 2) {
        gameOver = true;
        playTone(100, 0.2); // collision sound
        break;
      }
      const cx = distX - b.w / 2;
      const cy = distY - b.h / 2;
      if (cx * cx + cy * cy <= player.radius * player.radius) {
        gameOver = true;
        playTone(100, 0.2);
        break;
      }
    }
    if (!gameOver) score += dt / 1000; // seconds survived
  }

  function draw() {
    // Neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#330033');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with neon glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    const grad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.2, player.x, player.y, player.radius);
    grad.addColorStop(0, player.color);
    grad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw blocks with rounded corners and glow
    for (const b of blocks) {
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.color;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(b.x + radius, b.y);
      ctx.lineTo(b.x + b.w - radius, b.y);
      ctx.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + radius);
      ctx.lineTo(b.x + b.w, b.y + b.h - radius);
      ctx.quadraticCurveTo(b.x + b.w, b.y + b.h, b.x + b.w - radius, b.y + b.h);
      ctx.lineTo(b.x + radius, b.y + b.h);
      ctx.quadraticCurveTo(b.x, b.y + b.h, b.x, b.y + b.h - radius);
      ctx.lineTo(b.x, b.y + radius);
      ctx.quadraticCurveTo(b.x, b.y, b.x + radius, b.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

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
