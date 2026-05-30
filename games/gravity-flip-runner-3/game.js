// Simple Gravity Flip Runner
// Canvas with id="game" must exist in the page

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.offsetWidth || 800);
  const h = (canvas.height = canvas.offsetHeight || 400);

  const ball = { x: 80, y: h / 2, r: 12, vy: 0 };
  const GRAV = 0.5; // gravity magnitude
  let dir = 1; // 1 = down, -1 = up
  let speed = 2; // platform scroll speed
  let score = 0;
  let running = true;

  // platform definition: {x, y, w, h, spike?}
  const platforms = [];
  const PLAT_W = 80;
  const PLAT_GAP = 150;
  let nextX = w;

  function addPlatform() {
    const y = Math.random() * (h - 100) + 50;
    platforms.push({ x: nextX, y, w: PLAT_W, h: 20, spike: Math.random() < 0.2 });
    nextX += PLAT_W + PLAT_GAP;
  }
  // initial platforms
  for (let i = 0; i < 5; i++) addPlatform();

  function reset() {
    ball.y = h / 2;
    ball.vy = 0;
    dir = 1;
    score = 0;
    platforms.length = 0;
    nextX = w;
    for (let i = 0; i < 5; i++) addPlatform();
    running = true;
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', () => {
    if (!running) return reset();
    dir = -dir;
  });

  function loop() {
    if (!running) return;
    // physics
    ball.vy += GRAV * dir;
    ball.y += ball.vy;

    // platform collision (only against top surface according to gravity direction)
    // sounds setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, duration) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
      osc.start(now);
      osc.stop(now + duration / 1000);
    }
    for (const p of platforms) {
      if (dir === 1) {
        // falling down, check landing on top
        const onX = ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w;
        const onY = ball.y + ball.r >= p.y && ball.y + ball.r - ball.vy < p.y;
        if (onX && onY) {
          ball.y = p.y - ball.r;
          ball.vy = 0;
        }
      } else {
        // falling up, check ceiling contact
        const onX = ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w;
        const onY = ball.y - ball.r <= p.y + p.h && ball.y - ball.r - ball.vy > p.y + p.h;
        if (onX && onY) {
          ball.y = p.y + p.h + ball.r;
          ball.vy = 0;
        }
      }
    }

    // move platforms leftward (simulate forward motion)
    for (const p of platforms) p.x -= speed;
    // remove off‑screen platforms
    while (platforms.length && platforms[0].x + PLAT_W < 0) platforms.shift();
    // add new ones
    if (nextX - speed < w) addPlatform();
    nextX -= speed;

    // spike collision
    for (const p of platforms) {
      if (p.spike) {
        const withinX = ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w;
        const withinY = ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h;
        if (withinX && withinY) {
          running = false;
        }
      }
    }

    // lose if off canvas
    if (ball.y - ball.r > h || ball.y + ball.r < 0) running = false;

    // scoring
    score += speed * 0.1;

    // render
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#a0d8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ball with radial gradient for depth
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.r / 3,
      ball.y - ball.r / 3,
      ball.r / 4,
      ball.x,
      ball.y,
      ball.r
    );
    ballGrad.addColorStop(0, '#ff9999');
    ballGrad.addColorStop(1, '#ff4500');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // platforms with subtle shading and optional spikes
    for (const p of platforms) {
      // platform base
      const platGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      platGrad.addColorStop(0, p.spike ? '#c44' : '#777');
      platGrad.addColorStop(1, p.spike ? '#a00' : '#555');
      ctx.fillStyle = platGrad;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // draw spike as a triangle on top of platform when present
      if (p.spike) {
        ctx.fillStyle = '#800';
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2 - 10, p.y);
        ctx.lineTo(p.x + p.w / 2 + 10, p.y);
        ctx.lineTo(p.x + p.w / 2, p.y - 20);
        ctx.closePath();
        ctx.fill();
      }
    }
    // score text
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', w / 2, h / 2);
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
