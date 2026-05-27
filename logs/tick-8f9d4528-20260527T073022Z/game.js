// Minimal endless‑runner based on IDEA.md
// Targets <canvas id="game">
(() => {
  // Audio context and helper functions
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
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playJumpSound = () => playTone(440, 150);
  const playSlideSound = () => playTone(200, 150);
  const playGameOverSound = () => playTone(100, 500);

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize);
  resize();

  // Player
  const player = { w: 30, h: 30, x: 80, y: 0, vy: 0, onGround: false };
  const GRAVITY = 0.6, JUMP = -12, SLIDE_FRAMES = 15;
  let slide = 0;

  // Obstacles
  const obstacles = [];
  // clouds for background
  const clouds = [];
  const CLOUD_SPACING = 300;
  const CLOUD_SPEED = 2;
  const OB_SPEED = 6, OB_SPACING = 200;
  let frame = 0;
  const createObstacle = () => {
    const type = Math.random() < 0.5 ? 0 : 1; // 0 low, 1 high
    const w = 30;
    const h = type === 0 ? 30 : canvas.height * 0.4;
    const y = type === 0 ? canvas.height - h - 10 : 10;
    obstacles.push({ w, h, x: canvas.width + w, y, type });
  };

  const keyDown = e => {
if (e.code === 'Space' || e.key === 'ArrowUp') {
        if (player.onGround) { player.vy = JUMP; player.onGround = false; playJumpSound(); }
      } else if (e.key === 'ArrowDown') {
        if (player.onGround && slide === 0) { slide = SLIDE_FRAMES; playSlideSound(); }
      }
      if (player.onGround && slide === 0) slide = SLIDE_FRAMES;
    }
  };
  window.addEventListener('keydown', keyDown);

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    const groundY = canvas.height - player.h - 10;
    if (player.y >= groundY) { player.y = groundY; player.vy = 0; player.onGround = true; }
    if (slide > 0) { slide--; player.h = 15; } else { player.h = 30; }
    // obstacles movement
    obstacles.forEach(o => o.x -= OB_SPEED);
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    if (frame % OB_SPACING === 0) createObstacle();
    // clouds movement (parallax)
    clouds.forEach(c => c.x -= CLOUD_SPEED);
    while (clouds.length && clouds[0].x + clouds[0].w < 0) clouds.shift();
    if (frame % CLOUD_SPACING === 0) {
      const cloudW = 60 + Math.random() * 40;
      const cloudH = 30 + Math.random() * 20;
      const cloudY = 20 + Math.random() * (canvas.height * 0.3);
      clouds.push({ x: canvas.width, y: cloudY, w: cloudW, h: cloudH });
    }
    frame++;
    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
        playGameOverSound();
        alert('Game Over');
        document.location.reload();
        break;
      }
    }
  };

  const draw = () => {
    // background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87CEEB'); // light sky
    skyGrad.addColorStop(1, '#4682B4'); // deeper sky
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    // player as a rounded rectangle
    ctx.fillStyle = '#0f0';
    const radius = 6;
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
    ctx.fill();
    // obstacles with varying colors
    obstacles.forEach(o => {
      if (o.type === 0) {
        ctx.fillStyle = '#e74c3c'; // low obstacle red
      } else {
        ctx.fillStyle = '#f39c12'; // high obstacle orange
      }
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // draw clouds (simple ellipses)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(frame/10)}` , 10, 30);
  };

  const loop = () => { update(); draw(); requestAnimationFrame(loop); };
  loop();
})();
