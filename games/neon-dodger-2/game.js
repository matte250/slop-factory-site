// Neon Dodger – minimal canvas game
// Assumes an HTML canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to match CSS size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // pre-generate stars for background
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
  }));

  // Game state
  const player = { w: 40, h: 20, x: 0, y: 0, speed: 6, lives: 3 };
  const obstacles = [];
  let lastSpawn = 0;
  let gameOver = false;
  const keys = { ArrowLeft: false, ArrowRight: false };

  // Input handling
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const beep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  const spawnObstacle = () => {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: Math.random() * (canvas.width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
    // optional spawn sound
    // beep(300, 0.05);
  };

  const rectsCollide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = (dt) => {
    // Move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    // Spawn obstacles roughly every 800 ms
    if (performance.now() - lastSpawn > 800) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Collision
      if (rectsCollide(player, o)) {
        player.lives--;
        obstacles.splice(i, 1);
        beep(200, 0.1); // hit sound
        if (player.lives <= 0) {
          gameOver = true;
          beep(100, 0.5); // game over sound
        }
        continue;
      }
      // Remove off‑screen
      if (o.y > canvas.height) obstacles.splice(i, 1);
    }
  };

  const draw = () => {
    // Clear with dark gradient and starfield
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // simple starfield
    ctx.fillStyle = '#555';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Neon player ship with glow (triangle)
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    const shipY = canvas.height - player.h - 10;
    ctx.moveTo(player.x, shipY + player.h);
    ctx.lineTo(player.x + player.w / 2, shipY);
    ctx.lineTo(player.x + player.w, shipY + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset blur for other draws

    // Obstacles – glowing circles
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Lives counter
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + player.lives, 10, 20);
    if (gameOver) {
      ctx.fillStyle = '#f55';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let lastTime = 0;
  const loop = (time) => {
    const dt = time - lastTime;
    lastTime = time;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
