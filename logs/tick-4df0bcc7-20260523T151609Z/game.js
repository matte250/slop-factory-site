// Simple Canvas Meteor Dodge game with improved graphics
// Canvas element must have id="game"

(() => {
  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('mousedown', resumeAudio);
    canvas.removeEventListener('mousemove', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('mousedown', resumeAudio);
  canvas.addEventListener('mousemove', resumeAudio);

  // Play a short beep for collisions
  const playCollisionSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };

  // Play a subtle whoosh when a meteor spawns
  const playSpawnSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };

  // Helper to play a sound when a meteor is avoided (scoring)
  const playScoreSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  };

  // End of audio setup

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Full‑screen canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recreate stars on resize for full coverage
    stars.length = 0;
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
      });
    }
  };
  // Star field for background
  const stars = [];
  // Initial star generation
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.5,
    });
  }
  resize();
  window.addEventListener('resize', resize);

  // Player (triangle ship)
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    size: 20,
    speed: 5,
  };

  // Input handling (arrow keys / mouse)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  const meteors = [];
  let spawnTimer = 0;
  let spawnInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  const spawnMeteor = () => {
    const radius = Math.random() * 15 + 10;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const y = Math.random() * (canvas.height / 2);
    const x = side === 'left' ? -radius : canvas.width + radius;
    const speedX = (side === 'left' ? 1 : -1) * (2 + Math.random() * 2 + score / 1000);
    const speedY = 1 + Math.random() * 2 + score / 2000;
    meteors.push({ x, y, radius, speedX, speedY });
    playSpawnSound();
  };

  const update = (delta) => {
    // Player movement (arrow keys)
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(canvas.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height, player.y));

    // Spawn meteors
    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      spawnMeteor();
      spawnTimer = 0;
      // Gradually increase difficulty
      if (spawnInterval > 300) spawnInterval -= 10;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.speedX;
      m.y += m.speedY;
      // Remove off‑screen
      if (m.x < -m.radius || m.x > canvas.width + m.radius || m.y > canvas.height + m.radius) {
        meteors.splice(i, 1);
        score += 1;
        playScoreSound();
        continue;
      }
      // Collision detection (approximate ship as circle)
      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < m.radius + player.size / 2) {
        playCollisionSound();
        gameOver = true;
      }
    }
  };

  const drawShip = () => {
    // Ship gradient
    const shipGrad = ctx.createLinearGradient(0, player.y - player.size / 2, 0, player.y + player.size / 2);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size / 2);
    ctx.lineTo(player.x - player.size / 2, player.y + player.size / 2);
    ctx.lineTo(player.x + player.size / 2, player.y + player.size / 2);
    ctx.closePath();
    ctx.fill();
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Meteors with gradient glow
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
      grad.addColorStop(0, 'rgba(255,100,0,0.9)');
      grad.addColorStop(1, 'rgba(80,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Player ship with slight glow
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    drawShip();
    ctx.shadowBlur = 0; // reset
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
