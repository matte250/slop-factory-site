// Gravity Switch game – minimal implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure AudioContext is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  addEventListener('keydown', resumeAudio);
  addEventListener('pointerdown', resumeAudio);

  const playTone = (freq, duration = 0.1) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };

  const playFlipSound = () => playTone(440);
  const playCollisionSound = () => playTone(120);
  const playGameOverSound = () => playTone(60, 0.5);

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.width || 800;
  const H = canvas.height = canvas.height || 600;

  const ball = { x: W / 2, y: H / 2, r: 12, vy: 0, gDir: 1 }; // gDir: 1 = down, -1 = up
  const platforms = [];
  const PLAT_W = 80, PLAT_H = 12;
  let gameOver = false;

  // generate a platform every 1500 ms
  const spawn = () => {
    const side = Math.random() < 0.5 ? 'top' : 'bottom';
    const y = side === 'top' ? 0 : H - PLAT_H;
    const speed = side === 'top' ? 2 : -2; // move opposite direction
    platforms.push({ x: Math.random() * (W - PLAT_W), y, w: PLAT_W, h: PLAT_H, speed });
  };
  const spawnInterval = setInterval(spawn, 1500);

  const flipGravity = () => {
    playFlipSound();
    ball.gDir *= -1; // invert gravity
    ball.vy = -ball.gDir * 6; // give a small impulse
  };

  addEventListener('keydown', e => { if (e.code === 'Space') flipGravity(); });
  addEventListener('pointerdown', flipGravity);

  const rectCollision = (b, p) => {
    // simple AABB vs circle collision
    const closestX = Math.max(p.x, Math.min(b.x, p.x + p.w));
    const closestY = Math.max(p.y, Math.min(b.y, p.y + p.h));
    const dx = b.x - closestX;
    const dy = b.y - closestY;
    return dx * dx + dy * dy < b.r * b.r;
  };

  function update() {
    if (gameOver) return;
    // gravity
    ball.vy += 0.3 * ball.gDir;
    ball.y += ball.vy;

    // platform movement and removal
    for (let i = platforms.length - 1; i >= 0; i--) {
      const p = platforms[i];
      p.y += p.speed;
      if (p.y < -PLAT_H || p.y > H) platforms.splice(i, 1);
if (rectCollision(ball, p)) {
          playCollisionSound();
          gameOver = true;
          clearInterval(spawnInterval);
          break;
        }
    }

    // out of bounds
    if (ball.y - ball.r < 0 || ball.y + ball.r > H) {
      playGameOverSound();
      gameOver = true;
      clearInterval(spawnInterval);
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#252539');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ball with radial gradient for depth
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.r / 3,
      ball.y - ball.r / 3,
      ball.r * 0.2,
      ball.x,
      ball.y,
      ball.r
    );
    ballGrad.addColorStop(0, '#ff8a65');
    ballGrad.addColorStop(1, '#e64a19');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // platforms with rounded corners
    ctx.fillStyle = '#607d8b';
    platforms.forEach(p => {
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(p.x + radius, p.y);
      ctx.lineTo(p.x + p.w - radius, p.y);
      ctx.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + radius);
      ctx.lineTo(p.x + p.w, p.y + p.h - radius);
      ctx.quadraticCurveTo(p.x + p.w, p.y + p.h, p.x + p.w - radius, p.y + p.h);
      ctx.lineTo(p.x + radius, p.y + p.h);
      ctx.quadraticCurveTo(p.x, p.y + p.h, p.x, p.y + p.h - radius);
      ctx.lineTo(p.x, p.y + radius);
      ctx.quadraticCurveTo(p.x, p.y, p.x + radius, p.y);
      ctx.closePath();
      ctx.fill();
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  spawn();
  loop();
})();
