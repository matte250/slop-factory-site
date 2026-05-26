// Canvas Runner – minimal infinite runner
// Assumes an HTML canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  const ground = height - 30;
  // audio context and beep helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // generate static stars for background (sky area only)
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * (ground - 20), // keep above ground
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const player = { x: 50, y: height - 60, w: 30, h: 30, vy: 0, jumpStrength: -12, color: '#0a0' };
  const gravity = 0.6;
  // ground already defined earlier
  let obstacles = [];
  let frames = 0;
  let score = 0;
  let running = true;

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: width, y: ground - size, w: size, h: size, speed: 6, color: '#a00' });
  };

  const update = () => {
    if (!running) return;
    frames++;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h > ground) {
      player.y = ground - player.h;
      player.vy = 0;
    }

    // obstacles
    if (frames % 90 === 0) spawnObstacle(); // roughly one per 1.5s @60fps
    obstacles.forEach(o => o.x -= o.speed);
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        running = false;
        // play collision sound
        beep(200, 0.3);
        break;
      }
    }

    // scoring
    score = Math.floor(frames / 6);
    render();
    if (running) requestAnimationFrame(update);
    else renderGameOver();
  };

  const render = () => {
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      const radius = s.r + (Math.random() - 0.5) * 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.3, radius), 0, Math.PI * 2);
      ctx.fill();
    });
    // ground with gradient
    const groundGrad = ctx.createLinearGradient(0, ground, 0, height);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, ground, width, height - ground);
    // player - draw as circle
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();
    // obstacles – draw as spikes (triangles) with gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w/2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const renderGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', width / 2, height / 2 - 10);
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
  };

  // input
  const jump = () => {
    if (player.vy === 0) {
      player.vy = player.jumpStrength;
      // play jump sound
      beep(600, 0.08);
      // ensure audio context is running (required after user gesture)
      if (audioCtx.state !== 'running') audioCtx.resume();
    }
  };
  document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  // start loop
  requestAnimationFrame(update);
})();
