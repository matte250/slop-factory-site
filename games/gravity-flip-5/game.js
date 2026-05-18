// Gravity Flip Game – enhanced graphics
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, ms) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, ms);
  }
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;

  const SQUARE_SIZE = 30;
  let gravity = 0.4; // positive pulls down
  let square = { x: W / 2 - SQUARE_SIZE / 2, y: H / 2, vy: 0 };
  let gameOver = false;

  const platforms = [];
  const PLAT_W = 80, PLAT_H = 10;
  const PLAT_SPEED = 2;
  let platformTimer = 0;

  // Toggle gravity on click / tap
  canvas.addEventListener('pointerdown', () => { gravity = -gravity; playTone(440, 100); });

  function spawnPlatform() {
    const y = Math.random() * (H - 200) + 100; // avoid extreme edges
    platforms.push({ x: W, y, w: PLAT_W, h: PLAT_H });
  }

  function update(dt) {
    // Update square
    square.vy += gravity;
    square.y += square.vy;

    // Collision with platforms (only when moving down in current gravity direction)
    platforms.forEach(p => {
      if (
        square.vy * gravity > 0 && // moving towards platform according to gravity
        square.x + SQUARE_SIZE > p.x &&
        square.x < p.x + p.w &&
        ((gravity > 0 && square.y + SQUARE_SIZE >= p.y && square.y + SQUARE_SIZE - square.vy < p.y) ||
         (gravity < 0 && square.y <= p.y + p.h && square.y - square.vy > p.y + p.h))
      ) {
        // Land on platform
        square.vy = 0;
        square.y = gravity > 0 ? p.y - SQUARE_SIZE : p.y + p.h;
        playTone(660, 80); // landing sound
      }
    });

    // Scroll platforms leftward
    platforms.forEach(p => p.x -= PLAT_SPEED);
    // Remove off‑screen platforms
    while (platforms.length && platforms[0].x + PLAT_W < 0) platforms.shift();

    // Spawn platforms periodically
    platformTimer += dt;
    if (platformTimer > 1500) { // every 1.5 s
      spawnPlatform();
      platformTimer = 0;
    }

    // Check lose condition
    if (square.y < -SQUARE_SIZE || square.y > H) {
      if (!gameOver) {
        playTone(220, 300); // game over sound
        gameOver = true;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#111');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // draw square with rounded corners and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff5555';
    ctx.beginPath();
    const r = 6; // corner radius
    ctx.moveTo(square.x + r, square.y);
    ctx.lineTo(square.x + SQUARE_SIZE - r, square.y);
    ctx.quadraticCurveTo(square.x + SQUARE_SIZE, square.y, square.x + SQUARE_SIZE, square.y + r);
    ctx.lineTo(square.x + SQUARE_SIZE, square.y + SQUARE_SIZE - r);
    ctx.quadraticCurveTo(square.x + SQUARE_SIZE, square.y + SQUARE_SIZE, square.x + SQUARE_SIZE - r, square.y + SQUARE_SIZE);
    ctx.lineTo(square.x + r, square.y + SQUARE_SIZE);
    ctx.quadraticCurveTo(square.x, square.y + SQUARE_SIZE, square.x, square.y + SQUARE_SIZE - r);
    ctx.lineTo(square.x, square.y + r);
    ctx.quadraticCurveTo(square.x, square.y, square.x + r, square.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw platforms with subtle gradient
    platforms.forEach(p => {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
      grad.addColorStop(0, '#3a3aff');
      grad.addColorStop(1, '#1a1aff');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    });
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) {
      update(dt);
    }
    draw();
    if (gameOver) {
      // overlay game over
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    } else {
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
