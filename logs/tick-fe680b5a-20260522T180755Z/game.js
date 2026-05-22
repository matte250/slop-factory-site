// Simple Neon Grid Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio starts after user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', resumeAudio, { once: true });

  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30; // low rumble
  bgOsc.type = 'sine';
  bgGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  // Stop background on game over
  const stopBackground = () => {
    bgOsc.stop();
  };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill the window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Ship definition
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 6,
    speed: 4,
    color: '#0ff',
    dx: 0,
    dy: 0,
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const updateShip = () => {
    ship.dx = ship.dy = 0;
    if (keys.ArrowUp || keys.w) ship.dy = -ship.speed;
    if (keys.ArrowDown || keys.s) ship.dy = ship.speed;
    if (keys.ArrowLeft || keys.a) ship.dx = -ship.speed;
    if (keys.ArrowRight || keys.d) ship.dx = ship.speed;
    ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x + ship.dx));
    ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y + ship.dy));
  };

  // Obstacle grid
  const cols = 12;
  const rows = 12;
  const blocks = [];
  const initBlocks = () => {
    const w = canvas.width / cols;
    const h = canvas.height / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Leave a gap around the ship start position
        if (Math.abs(i - cols / 2) < 2 && Math.abs(j - rows / 2) < 2) continue;
        blocks.push({
          x: i * w,
          y: j * h,
          w: w - 2,
          h: h - 2,
          // direction toward centre
          vx: (canvas.width / 2 - i * w) * 0.001,
          vy: (canvas.height / 2 - j * h) * 0.001,
          color: '#f0f',
        });
      }
    }
  };
  initBlocks();

  let score = 0;
  let gameOver = false;
  const speedIncrease = 0.00005; // per frame

  const rectCircleCollide = (rect, cx, cy, cr) => {
    const distX = Math.abs(cx - rect.x - rect.w / 2);
    const distY = Math.abs(cy - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + cr) return false;
    if (distY > rect.h / 2 + cr) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= cr * cr;
  };

  const updateBlocks = () => {
    for (const b of blocks) {
      b.x += b.vx;
      b.y += b.vy;
      // gradually increase velocity toward centre
      const dirX = canvas.width / 2 - b.x;
      const dirY = canvas.height / 2 - b.y;
      const len = Math.hypot(dirX, dirY) || 1;
      b.vx += (dirX / len) * speedIncrease;
      b.vy += (dirY / len) * speedIncrease;
    }
  };

  const shipTrail = [];

const draw = () => {
    // background gradient (dark neon vibe)
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw ship trail (fading circles)
    shipTrail.push({ x: ship.x, y: ship.y });
    if (shipTrail.length > 12) shipTrail.shift();
    shipTrail.forEach((pt, i) => {
        const alpha = i / shipTrail.length;
        ctx.fillStyle = `rgba(0,255,255,${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, ship.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // draw ship with neon glow
    ctx.shadowColor = ship.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // draw blocks with subtle glow
    for (const b of blocks) {
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.shadowBlur = 0;

    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
  };

  const loop = () => {
    if (gameOver) return;
    updateShip();
    updateBlocks();
    // collision check
    for (const b of blocks) {
      if (rectCircleCollide(b, ship.x, ship.y, ship.r)) {
        gameOver = true;
        // play collision sound
        playTone(200, 0.2);
        break;
      }
    }
    score++;
    draw();
    requestAnimationFrame(loop);
  };

  loop();

  // simple game‑over overlay
  const showGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px monospace';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
  };

  // Hook into requestAnimationFrame to draw overlay once stopped
  const originalLoop = loop;
  const stopLoop = () => {
    gameOver = true;
    stopBackground();
    showGameOver();
    // final collision sound (already played)
  };
  // Replace loop with detection of finish
  const wrapper = () => {
    if (!gameOver) {
      originalLoop();
    } else {
      stopLoop();
    }
  };
  // start wrapper instead of original loop
  // (the first call already started original loop, replace it by re‑starting)
  cancelAnimationFrame(); // no‑op safe call
  requestAnimationFrame(wrapper);
})();
