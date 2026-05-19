// Orb Runner game – minimal implementation for canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Orb (player)
  const orb = { x: 80, y: H - 60, r: 20, vy: 0, jump: -12 };
  const GRAVITY = 0.6;

  // Game objects
  const obstacles = [];
  const stars = [];
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain).connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Input – click or tap makes the orb jump
  canvas.addEventListener('pointerdown', () => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!gameOver) {
      orb.vy = orb.jump;
      playSound(300, 0.1); // jump sound
    } else restart();
  });

  function spawnObstacle() {
    const height = 30 + Math.random() * 40;
    obstacles.push({ x: W, y: H - height, w: 20, h: height });
  }

  function spawnStar() {
    const size = 10;
    const y = 50 + Math.random() * (H - 150);
    stars.push({ x: W, y, r: size });
  }

  function reset() {
    orb.y = H - 60;
    orb.vy = 0;
    obstacles.length = 0;
    stars.length = 0;
    score = 0;
    gameOver = false;
    frameCount = 0;
  }

  function restart() {
    reset();
    requestAnimationFrame(loop);
  }

  let frameCount = 0;
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over – Score: ' + score, W / 2 - 120, H / 2);
      ctx.fillText('Click to restart', W / 2 - 90, H / 2 + 30);
      return;
    }

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#87CEEB');
    bg.addColorStop(1, '#1E90FF');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Update orb
    orb.vy += GRAVITY;
    orb.y += orb.vy;
    if (orb.y + orb.r > H) {
      orb.y = H - orb.r;
      orb.vy = 0;
    }
    // Draw orb with gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    const orbGrad = ctx.createRadialGradient(orb.x, orb.y, orb.r*0.3, orb.x, orb.y, orb.r);
    orbGrad.addColorStop(0, '#4A90E2');
    orbGrad.addColorStop(1, '#0033FF');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Spawn obstacles & stars
    if (frameCount % 120 === 0) spawnObstacle();
    if (frameCount % 180 === 0) spawnStar();

    // Update & draw obstacles with gradient
    const obsGrad = ctx.createLinearGradient(0, H - 100, 0, H);
    obsGrad.addColorStop(0, '#AA0000');
    obsGrad.addColorStop(1, '#550000');
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // Collision with orb
        if (
          orb.x + orb.r > o.x &&
          orb.x - orb.r < o.x + o.w &&
          orb.y + orb.r > o.y
        ) {
          gameOver = true;
          playSound(150, 0.3); // collision/death sound
        }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Update & draw stars with glow
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= 4;
      // radial gradient for star glow
      const starGrad = ctx.createRadialGradient(s.x, s.y, s.r*0.2, s.x, s.y, s.r);
      starGrad.addColorStop(0, '#fff700');
      starGrad.addColorStop(1, '#ffa500');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // Collect star
      const dx = orb.x - s.x;
      const dy = orb.y - s.y;
        if (dx * dx + dy * dy < (orb.r + s.r) * (orb.r + s.r)) {
          score += 10;
          playSound(600, 0.08); // star collect sound
          stars.splice(i, 1);
        }
      if (s.x + s.r < 0) stars.splice(i, 1);
    }

    // Score display
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    frameCount++;
    requestAnimationFrame(loop);
  }

  // Start game
  reset();
  requestAnimationFrame(loop);
})();
