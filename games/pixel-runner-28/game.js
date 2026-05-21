// Pixel Runner – simple endless side‑scroller
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;
  // background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, '#87ceeb'); // sky blue
  bgGradient.addColorStop(1, '#e0f7fa'); // light cyan
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  const groundHeight = 20;
  const player = { x: 50, y: H - groundHeight - 10, w: 10, h: 10, vy: 0, jump: -8 };
  const GRAVITY = 0.4;
  const obstacles = [];
  let frame = 0;
  let score = 0;

  const spawnObstacle = () => {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 60;
    obstacles.push({ x: W, y: H - groundHeight - h, w, h, passed: false });
  };

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > H - player.h) { player.y = H - player.h; player.vy = 0; }

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 3; // speed
      // score when passed
      if (!o.passed && o.x + o.w < player.x) { o.passed = true; score++; playTone(440, 0.05); }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // spawn new obstacles
    if (frame % 120 === 0) spawnObstacle();
    frame++;
  };

  const draw = () => {
    // clear and draw background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);
    // ground
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - groundHeight, W, groundHeight);
    // player as circle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();
    // obstacles as rectangles with gradient
    const obsGradient = ctx.createLinearGradient(0, 0, 0, H);
    obsGradient.addColorStop(0, '#ff7f7f');
    obsGradient.addColorStop(1, '#b20000');
    ctx.fillStyle = obsGradient;
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // score text with shadow for readability
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.shadowColor = 'transparent';
  };

  const loop = () => {
    update();
    draw();
    // collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // play game over sound (low pitch)
        playTone(220, 0.4);
        alert('Game Over! Score: ' + score);
        document.location.reload();
        return;
      }
    }
    requestAnimationFrame(loop);
  };

  // input handling
  const jump = () => {
    // ensure audio context is running (required by some browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (player.y >= H - player.h) {
      player.vy = player.jump;
      // play jump sound (high pitch)
      playTone(660, 0.08);
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('touchstart', jump);

  loop();
})();
