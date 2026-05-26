// Minimal endless‑runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playTone(300, 0.1);
  const playHit = () => playTone(100, 0.3);
  const playStar = () => playTone(600, 0.1);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;

  const GRAVITY = 0.6;
  const JUMP = -12;
  const SPEED = 4;

  const player = { x: 80, y: H - 50, w: 30, h: 30, vy: 0, onGround: true };
  const obstacles = [];
  const stars = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const width = 20 + Math.random() * 30;
    const height = 20 + Math.random() * 60;
    obstacles.push({ x: W, y: H - height, w: width, h: height });
  };
  const spawnStar = () => {
    const size = 12;
    const y = H - 80 - Math.random() * 120;
    stars.push({ x: W, y, w: size, h: size });
  };

  const reset = () => {
    player.y = H - 50; player.vy = 0; player.onGround = true;
    obstacles.length = 0; stars.length = 0; frames = 0; score = 0; gameOver = false;
    loop();
  };

  const jump = () => {
    // Ensure audio context is running (required after user interaction)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
      playJump();
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over – Score: ' + score, W / 2 - 150, H / 2);
      ctx.fillText('Tap/Space to restart', W / 2 - 140, H / 2 + 40);
      canvas.addEventListener('keydown', e => { if (e.code === 'Space') reset(); }, { once: true });
      canvas.addEventListener('pointerdown', reset, { once: true });
      return;
    }
    // update
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }

    obstacles.forEach(o => o.x -= SPEED);
    stars.forEach(s => s.x -= SPEED);
    // spawn
    if (frames % 120 === 0) spawnObstacle();
    if (frames % 300 === 0) spawnStar();
    // cleanup
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].w < 0) stars.shift();
    // collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        playHit();
        gameOver = true; break;
      }
    }
    // collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (player.x < s.x + s.w && player.x + player.w > s.x &&
          player.y < s.y + s.h && player.y + player.h > s.y) {
        score += 10; stars.splice(i, 1); playStar();
      }
    }
    score++;
    // draw background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#001d3d'); // dark blue top
    skyGrad.addColorStop(1, '#003566'); // lighter near ground
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, H - 20, W, 20);
    // helper for rounded rectangles
    const drawRounded = (x, y, w, h, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };
    // draw player as rounded square with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    drawRounded(player.x, player.y, player.w, player.h, 6, '#00ff80');
    ctx.shadowColor = 'transparent';
    // obstacles with varying colors
    obstacles.forEach(o => {
      const hue = Math.floor(Math.random() * 360);
      drawRounded(o.x, o.y, o.w, o.h, 3, `hsl(${hue},70%,50%)`);
    });
    // draw stars as 5‑point stars
    const drawStar = (cx, cy, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const theta = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        ctx.lineTo(x, y);
        const theta2 = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        const x2 = cx + (r / 2) * Math.cos(theta2);
        const y2 = cy + (r / 2) * Math.sin(theta2);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
    };
    stars.forEach(s => drawStar(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, '#ffdf00'));
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    frames++;
    requestAnimationFrame(loop);
  };
  loop();
})();
