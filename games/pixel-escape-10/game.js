// Minimal endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // background gradient (dark sky to deeper)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJump() { playTone(440, 0.1); }
  function playStar() { playTone(880, 0.08); }
  function playGameOver() { playTone(220, 0.4); }

  // Player definition
  const player = { x: 50, y: H - 30, w: 20, h: 20, dy: 0, onGround: false };
  const GRAVITY = 0.6, JUMP = -12, SLIDE_TIME = 300;
  let sliding = false, slideTimer = 0;

  // Game objects
  const obstacles = [];
  const stars = [];
  let score = 0, frame = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  document.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state !== 'running') audioCtx.resume(); });
  document.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    // simple spike block: 20x20 square
    const obs = { x: W, y: H - 20, w: 20, h: 20 };
    obstacles.push(obs);
  }
  function spawnStar() {
    const star = { x: W, y: Math.random() * (H - 60) + 30, r: 6 };
    stars.push(star);
  }

  function update() {
    if (gameOver) return;
    frame++;
    // player horizontal movement
    if (keys['ArrowLeft']) player.x -= 3;
    if (keys['ArrowRight']) player.x += 3;
    // clamp
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    // jump
    if (keys['ArrowUp'] && player.onGround) { player.dy = JUMP; player.onGround = false; playJump(); }
    // slide
    if (keys['ArrowDown'] && player.onGround && !sliding) { sliding = true; slideTimer = SLIDE_TIME; player.h = 10; }
    if (sliding) {
      slideTimer -= 16; // approx ms per frame
      if (slideTimer <= 0) { sliding = false; player.h = 20; }
    }
    // gravity
    player.dy += GRAVITY;
    player.y += player.dy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.dy = 0; player.onGround = true; }
    // obstacles movement & spawn
    if (frame % 120 === 0) spawnObstacle(); // every 2 seconds at 60fps
    obstacles.forEach(o => o.x -= 4);
    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // stars movement & spawn
    if (frame % 180 === 0) spawnStar();
    stars.forEach(s => s.x -= 4);
    while (stars.length && stars[0].x < 0) stars.shift();
    // collisions
    for (const o of obstacles) {
      if (rectIntersect(player, o)) { gameOver = true; playGameOver(); break; }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (circleRectIntersect(s, player)) { score++; playStar(); stars.splice(i, 1); }
    }
  }

  function draw() {
    // draw background gradient
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ground
    ctx.fillStyle = '#222';
    ctx.fillRect(0, H - 10, W, 10);
    // player (rounded)
    ctx.fillStyle = '#0af';
    const r = 4; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();
    // obstacles – draw as spikes (triangles)
    ctx.fillStyle = '#a00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // stars – glowing effect
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function circleRectIntersect(c, r) {
    const distX = Math.abs(c.x - r.x - r.w / 2);
    const distY = Math.abs(c.y - r.y - r.h / 2);
    if (distX > (r.w / 2 + c.r)) return false;
    if (distY > (r.h / 2 + c.r)) return false;
    if (distX <= (r.w / 2)) return true;
    if (distY <= (r.h / 2)) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= (c.r * c.r);
  }

  // start loop
  requestAnimationFrame(loop);
})();
