// Gravity Run – enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;

  // --- Game objects ---
  const ball = { x: W / 2, y: H - 30, r: 15, vx: 0, vy: 0, speed: 4 };
  const gravity = 0.3;
  const scrollSpeed = 2;
  const platforms = [];
  const spikes = [];
  const stars = [];
  let score = 0;
  const particles = []; // bounce effect particles
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
  if (e.key in keys) keys[e.key] = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Helper: spawn platform/spike/star
  function spawn() {
    // Ensure at least one platform on screen
    if (platforms.length === 0 || platforms[platforms.length - 1].y > 150) {
      const width = 80 + Math.random() * 120;
      const x = Math.random() * (W - width);
      const y = -20; // start above canvas
      platforms.push({ x, y, w: width, h: 10 });
      // 30% chance for spike on platform
      if (Math.random() < 0.3) {
        const sx = x + Math.random() * (width - 20) + 10;
        spikes.push({ x: sx, y: y - 10, size: 15 });
      }
      // 40% chance for star above platform
      if (Math.random() < 0.4) {
        const sx = x + Math.random() * (width - 20) + 10;
        stars.push({ x: sx, y: y - 30, r: 6, collected: false });
      }
    }
  }

  function rectCircleCollide(rect, circle) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  function update() {
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy;
      p.vy += 0.1; // gravity for particles
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    if (gameOver) return;
    // Input
    if (keys.ArrowLeft) ball.vx = -ball.speed;
    else if (keys.ArrowRight) ball.vx = ball.speed;
    else ball.vx = 0;

    // Physics
    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Keep ball within horizontal bounds
    if (ball.x - ball.r < 0) ball.x = ball.r;
    if (ball.x + ball.r > W) ball.x = W - ball.r;

    // Platform collision (only when falling)
    for (const p of platforms) {
      if (ball.vy > 0 && rectCircleCollide(p, ball)) {
        ball.y = p.y - ball.r;
        ball.vy = -8; // bounce/jump
        // Emit particles on bounce
        playSound(200, 'sawtooth', 0.08);
        const count = 8;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: ball.x,
            y: ball.y,
            vy: -2 - Math.random() * 2,
            r: 2 + Math.random() * 2,
            alpha: 1,
            color: '#ffcc80'
          });
        }
      }
    }

    // Spike collision
    for (const s of spikes) {
      const dx = ball.x - s.x;
      const dy = ball.y - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ball.r + s.size / 2) {
        // Emit red particles on death
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: ball.x,
            y: ball.y,
            vy: -2 - Math.random() * 2,
            r: 2 + Math.random() * 2,
            alpha: 1,
            color: '#ff8a80'
          });
        }
playSound(80, 'triangle', 0.3);
        gameOver = true;
      }
    }

    // Star collection with sparkle particles
    for (const st of stars) {
      if (!st.collected) {
        const dx = ball.x - st.x;
        const dy = ball.y - st.y;
        if (dx * dx + dy * dy < (ball.r + st.r) ** 2) {
          st.collected = true;
          score += 10;
          // Emit small spark particles
          for (let i = 0; i < 6; i++) {
            particles.push({
              x: st.x,
              y: st.y,
              vy: -1 - Math.random() * 1.5,
              r: 1 + Math.random() * 1,
              alpha: 1,
              color: '#fff59d'
            });
          }
        }
      }
    }

    // Scroll everything down
    for (const p of platforms) p.y += scrollSpeed;
    for (const s of spikes) s.y += scrollSpeed;
    for (const st of stars) st.y += scrollSpeed;

    // Remove off‑screen objects
    while (platforms.length && platforms[0].y > H) platforms.shift();
    while (spikes.length && spikes[0].y > H) spikes.shift();
    while (stars.length && stars[0].y > H) stars.shift();

    // Lose condition: fall off bottom
    if (ball.y - ball.r > H) gameOver = true;

    spawn();
    score += 0.1; // survival points
  }

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, W, H);
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#003566');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // Parallax stars (twinkling effect)
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  const starCount = 60;
  for (let i = 0; i < starCount; i++) {
    const sx = (i * 89) % W;
    const sy = ((i * 151) % H) + (Date.now() % 3000) * 0.015;
    ctx.fillRect(sx, sy, 2, 2);
  }
  // Ball with shadow and radial gradient
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  const ballGrad = ctx.createRadialGradient(ball.x, ball.y, ball.r * 0.3, ball.x, ball.y, ball.r);
  ballGrad.addColorStop(0, '#ff8a65');
  ballGrad.addColorStop(1, '#d84315');
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Platforms with subtle gradient
  // Draw particles (bounce effect)
  for (const p of particles) {
    ctx.globalAlpha = Math.max(p.alpha, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Platforms with subtle gradient
  const platGrad = ctx.createLinearGradient(0, 0, 0, 10);
  platGrad.addColorStop(0, '#78909c');
  platGrad.addColorStop(1, '#37474f');
  ctx.fillStyle = platGrad;
  for (const p of platforms) {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
  // Spikes (triangles) with outline
  ctx.fillStyle = '#e53935';
  ctx.strokeStyle = '#b71c1c';
  ctx.lineWidth = 1;
  for (const s of spikes) {
    ctx.beginPath();
    ctx.moveTo(s.x - s.size / 2, s.y + s.size / 2);
    ctx.lineTo(s.x + s.size / 2, s.y + s.size / 2);
    ctx.lineTo(s.x, s.y - s.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Stars (collectibles)
  ctx.fillStyle = '#ffeb3b';
  for (const st of stars) {
    if (st.collected) continue;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Score with contrasting stroke
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.strokeText('Score: ' + Math.floor(score), 10, 20);
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', W / 2, H / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), W / 2, H / 2 + 30);
  }
}

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  spawn();
  requestAnimationFrame(loop);
})();
