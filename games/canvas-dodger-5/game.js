// Minimal endless‑runner for canvas#game
// Player moves upward automatically; left/right arrows (or A/D) steer.
// Horizontal bars spawn at the top and move downward. Collision ends the game.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player settings
  const player = {
    w: 20,
    h: 20,
    x: width / 2 - 10,
    y: height - 30,
    speed: 3,
    color: '#0f0',
  };

  // Bar settings
  const bars = [];
  const barHeight = 10;
  const barMinWidth = 50;
  const barMaxWidth = 150;
  const barSpeed = 2;
  const spawnInterval = 1500; // ms

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;

  const keys = { left: false, right: false };
  const setKey = (e, down) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = down;
  };
  window.addEventListener('keydown', e => {
    // resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    setKey(e, true);
  });
  window.addEventListener('keyup', e => setKey(e, false));

  function spawnBar() {
    const w = Math.random() * (barMaxWidth - barMinWidth) + barMinWidth;
    const x = Math.random() * (width - w);
    bars.push({ x, y: -barHeight, w, h: barHeight, color: '#f00' });
    // sound on spawn
    playSound(400, 80);
  }

  function update(dt) {
    // player auto upward movement (actually we move bars down, so player stays roughly fixed vertically)
    // handle horizontal input
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    // keep player inside canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > width) player.x = width - player.w;

    // spawn bars
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnBar();
      lastSpawn = performance.now();
    }

    // move bars
    for (let i = bars.length - 1; i >= 0; i--) {
      const b = bars[i];
      b.y += barSpeed;
      // remove off‑screen bars
      if (b.y > height) bars.splice(i, 1);
    }

    // collision detection
    for (const b of bars) {
        if (
          player.x < b.x + b.w &&
          player.x + player.w > b.x &&
          player.y < b.y + b.h &&
          player.y + player.h > b.y
        ) {
          // collision sound
          playSound(200, 150, 'square');
          gameOver = true;
          break;
        }
    }
  }

  function draw() {
    // Fade trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // player as circle with gradient
    const pGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      2,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    pGrad.addColorStop(0, '#0f0');
    pGrad.addColorStop(1, '#030');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // bars with gradient
    for (const b of bars) {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    if (!gameOver) {
      const dt = timestamp - (lastFrame || timestamp);
      update(dt);
      draw();
      lastFrame = timestamp;
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with Game Over overlay
    }
  }

  let lastFrame;
  requestAnimationFrame(loop);
})();
