// Simple gravity‑flip canvas game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Helper: draw rounded rectangle (used for obstacles)
  function drawRoundedRect(x, y, w, h, r) {
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
  }

  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 400);
  const H = (canvas.height = canvas.clientHeight || 300);

  // ball
  const ball = { x: 50, y: H / 2, r: 10, vy: 0 };
  let gravity = 0.3; // positive = downwards

  // simple obstacles (spikes) – triangles at bottom/top
  const spikes = [
    { x: 200, y: H - 10, w: 20, h: 10, dir: -1 }, // bottom spike
    { x: 350, y: 0, w: 20, h: 10, dir: 1 } // top spike
  ];

  // moving obstacles – vertical bars moving horizontally
  const obstacles = [
    { x: 0, y: H / 2 - 30, w: 20, h: 60, vx: 2 },
    { x: W - 20, y: H / 2 + 20, w: 20, h: 60, vx: -2 }
  ];

  // stars for scoring
  const stars = [];
  let starTimer = 0;
  let score = 0;

  // input – flip gravity on click/tap
  canvas.addEventListener('click', () => { gravity = -gravity; playTone(440, 0.1); });

  function spawnStar() {
    const s = {
      x: Math.random() * (W - 20) + 10,
      y: Math.random() * (H - 20) + 10,
      r: 5,
      collected: false
    };
    stars.push(s);
  }

  function rectCircleCollide(rect, cx, cy, cr) {
  // collision detection unchanged
  const distX = Math.abs(cx - rect.x - rect.w / 2);
  const distY = Math.abs(cy - rect.y - rect.h / 2);
  if (distX > rect.w / 2 + cr) return false;
  if (distY > rect.h / 2 + cr) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= cr * cr;
}

  function spikeHit(spike) {
    // simple triangle hit test: treat as rectangle for brevity
    return rectCircleCollide({ x: spike.x, y: spike.y, w: spike.w, h: spike.h }, ball.x, ball.y, ball.r);
  }

  function gameOver() {
    // play game over sound
    playTone(220, 0.5);
    alert('Game over! Score: ' + score);
    // reset
    ball.x = 50; ball.y = H / 2; ball.vy = 0; gravity = 0.3; score = 0;
    stars.length = 0; starTimer = 0;
  }

  function update() {
    // physics
    ball.vy += gravity;
    ball.y += ball.vy;

    // keep within bounds (lose if out of canvas)
    if (ball.y - ball.r > H || ball.y + ball.r < 0) return gameOver();

    // spikes collision
    for (const sp of spikes) {
      if (spikeHit(sp)) return gameOver();
    }

    // obstacles collision
    for (const ob of obstacles) {
      if (rectCircleCollide(ob, ball.x, ball.y, ball.r)) return gameOver();
      ob.x += ob.vx;
      // bounce back
      if (ob.x < 0 || ob.x + ob.w > W) ob.vx = -ob.vx;
    }

    // stars collection
    for (const s of stars) {
      if (!s.collected && Math.hypot(ball.x - s.x, ball.y - s.y) < ball.r + s.r) {
        s.collected = true;
        score++;
      }
    }
    // remove collected stars
    while (stars.length && stars[0].collected) stars.shift();

    // spawn stars periodically
    starTimer++;
    if (starTimer > 150) { spawnStar(); starTimer = 0; }
  }

  function draw() {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#87ceeb');
    bgGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // draw ball with radial gradient and shadow
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.r / 3,
      ball.y - ball.r / 3,
      ball.r / 5,
      ball.x,
      ball.y,
      ball.r
    );
    ballGrad.addColorStop(0, '#fff');
    ballGrad.addColorStop(1, '#ff5722');
    ctx.fillStyle = ballGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // draw spikes (triangles)
    ctx.fillStyle = '#000';
    for (const sp of spikes) {
      ctx.beginPath();
      if (sp.dir === -1) { // bottom spike
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x + sp.w / 2, sp.y - sp.h);
        ctx.lineTo(sp.x + sp.w, sp.y);
      } else { // top spike
        ctx.moveTo(sp.x, sp.y + sp.h);
        ctx.lineTo(sp.x + sp.w / 2, sp.y);
        ctx.lineTo(sp.x + sp.w, sp.y + sp.h);
      }
      ctx.closePath();
      ctx.fill();
    }

  // draw moving obstacles with rounded corners
  ctx.fillStyle = '#3f51b5';
  for (const ob of obstacles) {
    drawRoundedRect(ob.x, ob.y, ob.w, ob.h, 5);
  }

    // draw stars
    ctx.fillStyle = '#ffeb3b';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start game loop
  loop();
})();
