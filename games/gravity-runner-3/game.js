// Gravity Runner – minimal canvas game
// Canvas with id="game" is expected in the HTML.
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.08); }
  function playGameOver() { playTone(100, 0.4); }

  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;

  // Game state
  let circle = { x: 80, y: H / 2, r: 12, vy: 0 };
  const GRAVITY = 0.45;
  const IMPULSE = -9;
  let platforms = [];
  // particle system
  if (!window.__particles) window.__particles = [];
  const PLAT_W = 60;
  const GAP_H = 80;
  const SPEED = 2;
  let score = 0;
  let died = false;
  let gameOverPlayed = false;

  // Input – click or tap gives upward thrust
  canvas.addEventListener('pointerdown', () => {
    if (!died) {
      // Ensure audio context is running
      audioCtx.resume();
      playThrust();
      circle.vy = IMPULSE;
      // create thrust particles
      for (let i = 0; i < 8; i++) {
        window.__particles.push({
          x: circle.x - circle.r,
          y: circle.y + (Math.random() - 0.5) * circle.r,
          vx: -Math.random() * 2 - 1,
          vy: (Math.random() - 0.5) * 2,
          life: 30,
          size: Math.random() * 2 + 1
        });
      }
    }
  });

  // Platform generator – creates a platform with a gap at random vertical position
  function addPlatform(xPos) {
    const gapY = Math.random() * (H - GAP_H - 40) + 20; // keep gap away from edges
    platforms.push({ x: xPos, gapY, w: PLAT_W });
  }

  // Initialize first platforms
  for (let i = 0; i < 4; i++) addPlatform(W + i * (PLAT_W + 120));

  function update() {
    if (died) return;
    // physics
    circle.vy += GRAVITY;
    circle.y += circle.vy;

    // move platforms left
    platforms.forEach(p => p.x -= SPEED);
    // remove off‑screen platforms
    if (platforms.length && platforms[0].x + PLAT_W < 0) {
      platforms.shift();
      score++;
    }
    // add new platforms as needed
    const last = platforms[platforms.length - 1];
    if (last && last.x < W) addPlatform(last.x + PLAT_W + 120);

    // update particles
    const particles = window.__particles;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // collision with platforms (except gap)
    for (const p of platforms) {
      if (circle.x + circle.r > p.x && circle.x - circle.r < p.x + PLAT_W) {
        if (circle.y - circle.r < p.gapY || circle.y + circle.r > p.gapY + GAP_H) {
died = true;
          if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
        }
      }
    }
    // lose when falling off bottom
    if (circle.y - circle.r > H) died = true;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars field (twinkling)
    if (!window.__stars) {
      window.__stars = [];
      for (let i = 0; i < 80; i++) {
        window.__stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
      }
    }
    ctx.fillStyle = '#fff';
    for (const s of window.__stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.x -= SPEED * 0.5;
      if (s.x < 0) s.x = W;
    }
    // draw platforms with subtle shading
    for (const p of platforms) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#666');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      // left part
      ctx.fillRect(p.x, 0, PLAT_W, p.gapY);
      // right part
      ctx.fillRect(p.x, p.gapY + GAP_H, PLAT_W, H - (p.gapY + GAP_H));
    }
    // draw particles (thrust)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const p of window.__particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw circle with radial gradient
    const circGrad = ctx.createRadialGradient(circle.x, circle.y, circle.r * 0.2, circle.x, circle.y, circle.r);
    circGrad.addColorStop(0, '#0f0');
    circGrad.addColorStop(1, '#060');
    ctx.fillStyle = circGrad;
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    ctx.fill();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (died) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    if (!died) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
