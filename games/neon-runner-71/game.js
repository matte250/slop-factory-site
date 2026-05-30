// Neon Runner – minimal endless runner
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Size (fallback if not set in HTML)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  const player = { size: 20, x: canvas.width / 2 - 10, y: canvas.height - 30, speed: 5 };
  const obstacles = [];
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  let gameOver = false;

  const keys = { ArrowLeft: false, ArrowRight: false };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Simple background hum
  setInterval(() => playTone(60, 0.2), 3000);

  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnObstacle() {
    const size = 20;
    const x = Math.random() * (canvas.width - size);
    obstacles.push({ x, y: -size, size, speed: 2 + Math.random() * 2 });
  }

  function update(dt) {
    // player movement
    if (keys.ArrowLeft) player.x = Math.max(0, player.x - player.speed);
    if (keys.ArrowRight) player.x = Math.min(canvas.width - player.size, player.x + player.speed);
    // obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // collision
      if (o.y + o.size > player.y && o.y < player.y + player.size &&
          o.x + o.size > player.x && o.x < player.x + player.size) {
        // collision sound
        playTone(300, 0.2);
        gameOver = true;
      }
      // remove off‑screen
      if (o.y > canvas.height) obstacles.splice(i, 1);
    }
    // spawn new obstacles
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = Date.now();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // neon colors with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => {
      // draw rounded neon obstacles
      ctx.beginPath();
      ctx.moveTo(o.x + o.size/2, o.y);
      ctx.quadraticCurveTo(o.x + o.size, o.y, o.x + o.size, o.y + o.size/2);
      ctx.quadraticCurveTo(o.x + o.size, o.y + o.size, o.x + o.size/2, o.y + o.size);
      ctx.quadraticCurveTo(o.x, o.y + o.size, o.x, o.y + o.size/2);
      ctx.quadraticCurveTo(o.x, o.y, o.x + o.size/2, o.y);
      ctx.closePath();
      ctx.fill();
    });
    // reset shadow for UI
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
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
