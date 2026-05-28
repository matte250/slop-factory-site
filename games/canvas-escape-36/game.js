// Minimalist Canvas Escape game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = 400);
  const height = (canvas.height = 300);

  // Simple audio helper using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const player = { x: 50, y: height / 2 - 10, size: 20, speed: 3 };
  const barriers = [];
  let score = 0;
  let gameOver = false;
  let frame = 0;

  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBarrier() {
    const gap = 80; // vertical gap for player to pass
    const topHeight = Math.random() * (height - gap);
    const bottomY = topHeight + gap;
    barriers.push({ x: width, w: 20, top: topHeight, bottom: bottomY });
  }

  function update() {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) {
      player.y -= player.speed;
      playTone(440, 0.05); // up move beep
    }
    if (keys.ArrowDown) {
      player.y += player.speed;
      playTone(330, 0.05); // down move beep
    }
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // barrier movement
    for (let i = barriers.length - 1; i >= 0; i--) {
      const b = barriers[i];
      b.x -= 2;
if (b.x + b.w < 0) {
          barriers.splice(i, 1);
          score++;
          playTone(600, 0.1); // score beep
        }
    }
    // spawn new barrier every 120 frames
    if (frame % 120 === 0) spawnBarrier();
    frame++;

    // collision detection
    for (const b of barriers) {
      const withinX = player.x < b.x + b.w && player.x + player.size > b.x;
      const hitsTop = player.y < b.top;
      const hitsBottom = player.y + player.size > b.bottom;
      if (withinX && (hitsTop || hitsBottom)) {
        gameOver = true;
        break;
      }
    }
  }

  // Draw the background stars
  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  function draw() {
    // Clear with dark space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Update and draw stars (parallax effect)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player – rounded square with gradient and glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    const playerGrad = ctx.createLinearGradient(
      player.x,
      player.y,
      player.x + player.size,
      player.y + player.size
    );
    playerGrad.addColorStop(0, '#0f0');
    playerGrad.addColorStop(1, '#0a0');
    ctx.fillStyle = playerGrad;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // Reset shadow for other elements
    ctx.shadowBlur = 0;

    // Barriers – red with slight transparency and rounded corners
    ctx.fillStyle = 'rgba(255,0,0,0.7)';
    for (const b of barriers) {
      // top barrier
      ctx.beginPath();
      ctx.moveTo(b.x, 0);
      ctx.lineTo(b.x + b.w, 0);
      ctx.lineTo(b.x + b.w, b.top);
      ctx.lineTo(b.x, b.top);
      ctx.closePath();
      ctx.fill();
      // bottom barrier
      ctx.beginPath();
      ctx.moveTo(b.x, b.bottom);
      ctx.lineTo(b.x + b.w, b.bottom);
      ctx.lineTo(b.x + b.w, height);
      ctx.lineTo(b.x, height);
      ctx.closePath();
      ctx.fill();
    }

    // Score – neon style
    ctx.fillStyle = '#0ff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      // Dim overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
