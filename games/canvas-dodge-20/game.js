// Canvas Dodge game implementation
// Target canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  let audioCtx = null;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  const playTone = (freq, dur) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player configuration
  const player = {
    width: 30,
    height: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 5,
    color: '#0af'
  };

  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    initAudio();
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  // Obstacles
  const obstacles = [];
  const obstacleInterval = 1000; // ms
  const obstacleSpeed = 2;

  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, size, speed: obstacleSpeed + Math.random() });
  }

  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;

  function update(dt) {
    // Move player
    if (keys.left) player.x = Math.max(0, player.x - player.speed);
    if (keys.right) player.x = Math.min(width - player.width, player.x + player.speed);

    // Spawn obstacles
    if (performance.now() - lastSpawn > obstacleInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Remove off‑screen
      if (o.y > height) obstacles.splice(i, 1);
      // Collision check
      if (
        o.x < player.x + player.width &&
        o.x + o.size > player.x &&
        o.y < player.y + player.height &&
        o.y + o.size > player.y
      ) {
        gameOver = true;
        // Play crash sound
        playTone(150, 0.4);
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#001');
    bgGradient.addColorStop(1, '#004');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    // Reset for subsequent drawing
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;
    ctx.clearRect(0, 0, width, height);
    // Player (rounded rectangle)
    ctx.fillStyle = player.color;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.width - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + radius);
    ctx.lineTo(player.x + player.width, player.y + player.height - radius);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height);
    ctx.lineTo(player.x + radius, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // Obstacles (gradient circles)
    obstacles.forEach(o => {
      const hue = Math.floor(Math.random() * 360);
      const grad = ctx.createRadialGradient(
        o.x + o.size / 2,
        o.y + o.size / 2,
        0,
        o.x + o.size / 2,
        o.y + o.size / 2,
        o.size / 2
      );
      grad.addColorStop(0, `hsl(${hue},80%,70%)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.size / 2, o.y + o.size / 2, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastRender || timestamp);
    if (!gameOver) update(dt);
    draw();
    lastRender = timestamp;
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastRender;
  requestAnimationFrame(loop);
})();
