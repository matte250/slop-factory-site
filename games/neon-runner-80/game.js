// Simple endless runner for canvas#game
// Player can jump (Space) or slide (ArrowDown)
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Player
  const player = { x: 50, y: H - 60, w: 40, h: 60, vy: 0, onGround: true, slide: false };
  const GRAVITY = 0.6;
  const JUMP_VEL = -12;
  const SLIDE_TIME = 300; // ms

  // Obstacles
  const obstacles = [];
  const OBSTACLE_FREQ = 1500; // ms
  let lastObs = 0;

  // Input handling
  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.onGround && !player.slide) {
      player.vy = JUMP_VEL;
      player.onGround = false;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playTone(440, 0.2); // jump sound
    }
    if (e.code === 'ArrowDown' && player.onGround && !player.slide) {
      player.slide = true;
      player.h = 30; // lower hitbox
      playTone(220, 0.2); // slide sound
      setTimeout(() => {
        player.slide = false;
        player.h = 60;
        player.y = H - player.h - 0;
      }, SLIDE_TIME);
    }
  });

  function addObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'wall';
    const w = type === 'spike' ? 30 : 40;
    const h = type === 'spike' ? 30 : 60;
    const x = W + w;
    const y = H - h;
    obstacles.push({ x, y, w, h, type });
  }

  function update(dt) {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // speed
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn obstacles
    if (performance.now() - lastObs > OBSTACLE_FREQ) {
      addObstacle();
      lastObs = performance.now();
    }
    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // simple lose: stop animation
        cancelAnimationFrame(frameId);
        // play collision sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playTone(100, 0.5);
        ctx.fillStyle = 'red';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', W / 2 - 80, H / 2);
        return;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // neon glow for player with rounded shape
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w * 0.2, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + player.h * 0.2);
    ctx.lineTo(player.x + player.w, player.y + player.h * 0.8);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w * 0.8, player.y + player.h);
    ctx.lineTo(player.x + player.w * 0.2, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h * 0.8);
    ctx.lineTo(player.x, player.y + player.h * 0.2);
    ctx.quadraticCurveTo(player.x, player.y, player.x + player.w * 0.2, player.y);
    ctx.closePath();
    ctx.fill();
    // reset shadow for obstacles
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // obstacles with gradient fill
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#a00');
      grad.addColorStop(1, '#f44');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
  }

  let lastTime = 0, frameId;
  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    draw();
    frameId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
