// Simple gravity‑flip canvas game
// The HTML contains <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set size to match canvas attributes or fill window
  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    vy: 0,
  };
  let gravity = 0.4; // positive pulls down, negative pulls up

  // Spike definition: {x, width, side, ttl}
  // side: 'top' or 'bottom'
  const spikes = [];
  const spikeWidth = 50;
  const spikeHeight = 12;
  const spikeTTL = 3000; // ms before disappearing
  const spikeInterval = 1200; // ms between spawns

  let lastSpikeTime = 0;
  let startTime = performance.now();
  let gameOver = false;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  const flipGravity = () => {
    gravity = -gravity;
    // short high‑pitch tone on gravity flip
    playTone(440, 0.1);
  };

  // Play a tone and mark game over (once)
  const endGame = () => {
    if (!gameOver) {
      playTone(220, 0.3);
      gameOver = true;
    }
  };
  canvas.addEventListener('click', () => { audioCtx.resume().then(() => flipGravity()); });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); audioCtx.resume().then(() => flipGravity()); }, { passive: false });

  const spawnSpike = () => {
    const side = Math.random() < 0.5 ? 'top' : 'bottom';
    const x = Math.random() * (canvas.width - spikeWidth);
    spikes.push({ x, width: spikeWidth, side, born: performance.now() });
  };

  const update = (dt) => {
    if (gameOver) return;
    // ball physics
    ball.vy += gravity;
    ball.y += ball.vy;

    // spawn spikes
    if (performance.now() - lastSpikeTime > spikeInterval) {
      spawnSpike();
      lastSpikeTime = performance.now();
    }

    // remove old spikes
    for (let i = spikes.length - 1; i >= 0; i--) {
      if (performance.now() - spikes[i].born > spikeTTL) spikes.splice(i, 1);
    }

    // collision detection
    for (const s of spikes) {
      const spikeTop = s.side === 'top' ? 0 : canvas.height - spikeHeight;
      const spikeBottom = spikeTop + spikeHeight;
      const withinX = ball.x + ball.radius > s.x && ball.x - ball.radius < s.x + s.width;
      if (s.side === 'top') {
        if (withinX && ball.y - ball.radius <= spikeBottom) {
          endGame();
        }
      } else { // bottom
        if (withinX && ball.y + ball.radius >= spikeTop) {
          endGame();
        }
      }
    }

    // out of bounds check
    if (ball.y - ball.radius > canvas.height || ball.y + ball.radius < 0) {
      endGame();
    }
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0d47a1');
    bgGrad.addColorStop(1, '#1976d2');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw ball with radial gradient for shading
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.radius / 3,
      ball.y - ball.radius / 3,
      ball.radius / 4,
      ball.x,
      ball.y,
      ball.radius
    );
    ballGrad.addColorStop(0, '#ffcc80');
    ballGrad.addColorStop(1, '#ff5722');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // draw spikes as triangles with a subtle gradient
    for (const s of spikes) {
      const y = s.side === 'top' ? 0 : canvas.height;
      ctx.beginPath();
      if (s.side === 'top') {
        ctx.moveTo(s.x, y);
        ctx.lineTo(s.x + s.width / 2, y - spikeHeight);
        ctx.lineTo(s.x + s.width, y);
      } else {
        ctx.moveTo(s.x, y);
        ctx.lineTo(s.x + s.width / 2, y + spikeHeight);
        ctx.lineTo(s.x + s.width, y);
      }
      ctx.closePath();
      const spikeGrad = ctx.createLinearGradient(0, y, 0, y + (s.side === 'top' ? -spikeHeight : spikeHeight));
      spikeGrad.addColorStop(0, '#212121');
      spikeGrad.addColorStop(1, '#424242');
      ctx.fillStyle = spikeGrad;
      ctx.fill();
    }

    // score text with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const score = ((performance.now() - startTime) / 1000).toFixed(2);
    ctx.fillText(`Score: ${score}s`, 10, 20);
    ctx.shadowColor = 'transparent';

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffeb3b';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let lastTime = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
