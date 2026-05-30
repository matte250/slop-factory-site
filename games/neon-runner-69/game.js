// Simple endless runner for canvas#game
(() => {
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);
  const GRAV = 0.6;
  const PLAYER = { w: 50, h: 80, x: 80, y: H - 80, vy: 0, slide: false };
  const OBSTACLES = [];
  let lastSpawn = 0;
  let gameOver = false;

  function spawn() {
    const size = Math.random() > 0.5 ? { w: 30, h: 70 } : { w: 60, h: 40 };
    OBSTACLES.push({ x: W, y: H - size.h, w: size.w, h: size.h });
  }

  function update(dt) {
    // player physics
    PLAYER.vy += GRAV;
    PLAYER.y += PLAYER.vy;
    if (PLAYER.y > H - PLAYER.h) { PLAYER.y = H - PLAYER.h; PLAYER.vy = 0; }
    // slide timer
    if (PLAYER.slide) { PLAYER.slide = false; PLAYER.h = 80; }
    // obstacles
    for (let i = OBSTACLES.length - 1; i >= 0; i--) {
      const o = OBSTACLES[i];
      o.x -= 5;
      if (o.x + o.w < 0) OBSTACLES.splice(i, 1);
      // collision
if (!gameOver && rectCollide(PLAYER, o)) {
          // collision sound
          playTone(220, 0.2);
          gameOver = true;
        }
    }
    // spawn new obstacles
    if (Date.now() - lastSpawn > 1500) { spawn(); lastSpawn = Date.now(); }
  }

  function draw() {
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a2a');
    bg.addColorStop(1, '#000022');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ground
    ctx.fillStyle = '#222';
    ctx.fillRect(0, H - 20, W, 20);

    // helper for rounded rects
    function roundRect(x, y, w, h, r) {
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
    }

    // player with neon glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    roundRect(PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // obstacles with glow
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f44';
    OBSTACLES.forEach(o => {
      roundRect(o.x, o.y, o.w, o.h, 5);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    if (gameOver) {
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // input
  canvas.addEventListener('click', () => {
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // jump sound
    playTone(440, 0.1);
    if (PLAYER.y >= H - PLAYER.h) PLAYER.vy = -12; // jump
  });
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowDown' && !PLAYER.slide) {
      PLAYER.slide = true;
      PLAYER.h = 40; // crouch height
      PLAYER.y = H - PLAYER.h;
      setTimeout(() => { PLAYER.slide = false; PLAYER.h = 80; PLAYER.y = H - PLAYER.h; }, 300);
    }
  });

  loop();
})();
