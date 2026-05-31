// Minimal Neon Runner game implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill parent
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;
  // Audio setup
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   function playTone(freq, duration) {
     const osc = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     osc.type = 'sine';
     osc.frequency.value = freq;
     osc.connect(gain);
     gain.connect(audioCtx.destination);
     gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
     osc.start();
     setTimeout(() => {
       gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
       osc.stop(audioCtx.currentTime + 0.1);
     }, duration);
   }
   // simple sound shortcuts
   const spawnSound = () => playTone(600, 100);
   const crashSound = () => playTone(200, 200);
   const gameOverSound = () => playTone(100, 400);

   // canvas size already set above

  const player = { x: canvas.width / 2, y: canvas.height - 30, size: 6, color: '#0ff' };
  const speed = 2; // forward speed (pixels per frame)
  const laneWidth = 50; // horizontal movement step

  let obstacles = [];
  const obstacleFreq = 120; // frames between obstacles
  let frame = 0;
  let gameOver = false;
  let timer = 60 * 30; // 30‑second timer (assuming 60fps)

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * Math.floor(canvas.width / laneWidth));
    const x = lane * laneWidth + laneWidth / 2;
    obstacles.push({ x, y: -10, size: 8, color: '#f0f' });
    // play spawn sound
    spawnSound();
  }

  function update() {
    if (gameOver) return;
    frame++;
    timer--;
    // move obstacles down
    obstacles.forEach(o => o.y += speed);
    // remove passed obstacles
    obstacles = obstacles.filter(o => o.y < canvas.height + o.size);
    // spawn new
    if (frame % obstacleFreq === 0) spawnObstacle();
    // collision detection
    for (const o of obstacles) {
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < (o.size + player.size) / 2) {
        crashSound();
        gameOver = true;
        break;
      }
    }
    // timer end condition
    if (timer <= 0) {
      gameOverSound();
      gameOver = true;
    }
  }

  function draw() {
    // neon tunnel background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // moving tunnel lines
    ctx.strokeStyle = 'rgba(0,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const lineSpacing = 30;
    const offset = (frame * speed) % lineSpacing;
    for (let x = 0; x <= canvas.width; x += lineSpacing) {
      const sx = x + offset;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvas.height);
    }
    ctx.stroke();
    // draw obstacles with glow
    obstacles.forEach(o => {
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // draw player with glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // draw timer
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`Time: ${(timer / 60).toFixed(1)}s`, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.shadowColor = '#f88';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#f88';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // input: left/right arrow keys to shift player horizontally
  window.addEventListener('keydown', e => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft') {
      player.x = Math.max(player.x - laneWidth, laneWidth / 2);
    } else if (e.key === 'ArrowRight') {
      player.x = Math.min(player.x + laneWidth, canvas.width - laneWidth / 2);
    }
  });

  loop();
})();
