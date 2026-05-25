// Canvas Endless Runner – minimal implementation
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
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
  // Ensure audio context runs after user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  document.addEventListener('click', resumeAudio, {once:true});
  document.addEventListener('keydown', resumeAudio, {once:true});
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  const player = { x: 50, y: H - 30, w: 20, h: 20, vy: 0, jumpStrength: -8, color: '#4287f5' };
  const gravity = 0.4;
  const obstacles = [];
  const stars = [];
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({ x: W, y: H - size, w: size, h: size, color: '#d33' });
  }
  function spawnStar() {
    const size = 10;
    stars.push({ x: W, y: H - 30 - Math.random() * 80, r: size, color: '#fc0' });
  }

  // timing
  let obstacleTimer = 0;
  let starTimer = 0;

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h > H) { player.y = H - player.h; player.vy = 0; }

    // move obstacles
    obstacles.forEach(o => o.x -= 3);
    stars.forEach(s => s.x -= 3);
    // remove off-screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].r < 0) stars.shift();

    // spawn logic
    if (obstacleTimer-- <= 0) { spawnObstacle(); obstacleTimer = 80 + Math.random() * 40; }
    if (starTimer-- <= 0) { spawnStar(); starTimer = 120 + Math.random() * 80; }

    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        playTone(100, 0.3); // collision sound
        break;
      }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = (player.x + player.w / 2) - s.x;
      const dy = (player.y + player.h / 2) - s.y;
      if (Math.hypot(dx, dy) < s.r + Math.min(player.w, player.h) / 2) {
        score++;
        stars.splice(i, 1);
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 10);
    ctx.lineTo(W, H - 10);
    ctx.stroke();

    // player (rounded rectangle)
    ctx.fillStyle = player.color;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // obstacles (spikes as triangles with gradient)
    const spikeGrad = ctx.createLinearGradient(0, H - 40, 0, H);
    spikeGrad.addColorStop(0, '#a00');
    spikeGrad.addColorStop(1, '#d33');
    ctx.fillStyle = spikeGrad;
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // stars (twinkling)
    const time = Date.now() / 1000;
    stars.forEach(s => {
      ctx.fillStyle = s.color;
      const pulsate = 1 + 0.3 * Math.sin(time * 5 + s.x);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * pulsate, 0, Math.PI * 2);
      ctx.fill();
    });

    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input
  function jump() {
    if (player.vy === 0) {
      player.vy = player.jumpStrength;
      playTone(300, 0.1); // jump sound
    }
  }
  document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  loop();
})();
