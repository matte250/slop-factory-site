// Simple pixel runner game for canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // Canvas not present
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // Create background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
  bgGrad.addColorStop(0, '#0a0a2a');
  bgGrad.addColorStop(1, '#001');

  // Helper to draw rounded rectangles
  function roundRect(x, y, w, h, r, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  // Simple cloud objects for parallax effect
  const clouds = [];
  function spawnCloud() {
    const cw = 30 + Math.random() * 40;
    const ch = cw * 0.6;
    clouds.push({x: W, y: 20 + Math.random() * 40, w: cw, h: ch, speed: speed * 0.3});
  }

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once: true});
  window.addEventListener('touchstart', resumeAudio, {once: true});

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function playJump() { playTone(440, 0.08); }
  function playHit() { playTone(150, 0.3); }


  const gravity = 0.6;
  const jumpStrength = -12;
  const groundHeight = 20;
  const player = {x: 50, y: H - groundHeight - 20, w: 20, h: 20, vy: 0, onGround: true};
  const obstacles = [];
  let frame = 0;
  let speed = 4;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => {if (e.code === 'Space') keys.space = true;});
  window.addEventListener('keyup', e => {if (e.code === 'Space') keys.space = false;});
  canvas.addEventListener('touchstart', () => keys.space = true);
  canvas.addEventListener('touchend', () => keys.space = false);

  function reset() {
    player.y = H - groundHeight - player.h; player.vy = 0; player.onGround = true;
    obstacles.length = 0; clouds.length = 0; frame = 0; speed = 4; gameOver = false;
  }

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({x: W, y: H - size, w: size, h: size});
  }

  function update() {
    if (gameOver) return;
    // Player physics
    if (keys.space && player.onGround) {player.vy = jumpStrength; player.onGround = false; playJump();}
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= H) {player.y = H - player.h; player.vy = 0; player.onGround = true;}
    // Obstacles
    if (frame % 90 === 0) spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        playHit();
        gameOver = true;
      }
    }
    // Clouds (parallax)
    if (frame % 150 === 0) spawnCloud();
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) clouds.splice(i, 1);
    }
    frame++;
    speed += 0.001; // gradually increase difficulty
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // clouds (parallax)
    clouds.forEach(c => {
      roundRect(c.x, c.y, c.w, c.h, c.h/2, 'rgba(255,255,255,0.4)');
    });
    // player (rounded)
    roundRect(player.x, player.y, player.w, player.h, 4, '#0f0');
    // obstacles (rounded)
    obstacles.forEach(o => {
      roundRect(o.x, o.y, o.w, o.h, 4, '#f00');
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Tap to Restart', W/2, H/2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', () => {if (gameOver) reset();});
  canvas.addEventListener('touchend', () => {if (gameOver) reset();});

  reset();
  loop();
})();
