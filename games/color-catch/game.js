// Color Catch game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // --- Audio Setup ---
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Unlock audio on first user interaction
  const unlockAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('mousedown', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('mousedown', unlockAudio);

  const playTone = (freq, duration = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };

  const playBounce = () => playTone(300);
  const playCorrect = () => playTone(600);
  const playWrong = () => playTone(150);
  const playGameOver = () => {
    // descending tones
    [400, 300, 200].forEach((f, i) => setTimeout(() => playTone(f, 0.2), i * 200));
  };

  const colors = ['red', 'green', 'blue', 'yellow'];
  const paddle = { w: 80, h: 10, x: width / 2 - 40, y: height - 20, speed: 5 };
  const ball = { r: 8, x: width / 2, y: height / 2, vx: 3, vy: -3, color: 'red' };
  const blocks = [];
  let lives = 3;
  let score = 0;
  let lastBlockTime = 0;
  const blockInterval = 1500; // ms

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBlock() {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 20;
    const x = Math.random() * (width - size);
    blocks.push({ x, y: -size, w: size, h: size, color, speed: 2 });
  }

  function update(dt) {
    // paddle movement
    if (keys.ArrowLeft) paddle.x -= paddle.speed;
    if (keys.ArrowRight) paddle.x += paddle.speed;
    paddle.x = Math.max(0, Math.min(width - paddle.w, paddle.x));

    // ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;
    // wall collisions
    if (ball.x - ball.r < 0 || ball.x + ball.r > width) {
      ball.vx *= -1;
      ball.color = colors[Math.floor(Math.random() * colors.length)];
      playBounce();
    }
    if (ball.y - ball.r < 0) {
      ball.vy *= -1;
      ball.color = colors[Math.floor(Math.random() * colors.length)];
    }
    if (ball.y + ball.r > height) {
      ball.vy *= -1;
    }

    // spawn blocks
    if (Date.now() - lastBlockTime > blockInterval) {
      spawnBlock();
      lastBlockTime = Date.now();
    }

    // update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // check collision with paddle
      if (
        b.y + b.h >= paddle.y &&
        b.x < paddle.x + paddle.w &&
        b.x + b.w > paddle.x
      ) {
        if (b.color === ball.color) {
          score++;
          playCorrect();
        } else {
          lives--;
          playWrong();
        }
        blocks.splice(i, 1);
        continue;
      }
      // missed block
      if (b.y > height) {
        if (b.color === ball.color) {
          lives--;
          playWrong();
        }
        blocks.splice(i, 1);
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Paddle with rounded corners and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#888';
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.w - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.w, paddle.y, paddle.x + paddle.w, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.w, paddle.y + paddle.h - radius);
    ctx.quadraticCurveTo(paddle.x + paddle.w, paddle.y + paddle.h, paddle.x + paddle.w - radius, paddle.y + paddle.h);
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.h);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.h, paddle.x, paddle.y + paddle.h - radius);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Ball with radial gradient
    const radGrad = ctx.createRadialGradient(ball.x, ball.y, ball.r * 0.2, ball.x, ball.y, ball.r);
    radGrad.addColorStop(0, 'white');
    radGrad.addColorStop(0.6, ball.color);
    radGrad.addColorStop(1, 'black');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Blocks with slight border
    for (const b of blocks) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${lives}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (lives > 0) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Play game over sound once
      if (lives === 0) playGameOver();
      ctx.fillStyle = '#000';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }
  requestAnimationFrame(loop);
})();
