// Neon Escape – enhanced graphics
// Targets canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game settings
  const player = { x: 30, y: 30, r: 8, speed: 2 };
  const exit = { x: width - 40, y: height - 40, w: 30, h: 30 };
  const timerTotal = 30; // seconds
  let timeLeft = timerTotal;
  const lasers = [];
  const laserCount = 5;

  // Init lasers (horizontal moving bars)
  for (let i = 0; i < laserCount; i++) {
    const w = 100;
    const h = 4;
    const y = (i + 1) * (height / (laserCount + 1));
    const dir = i % 2 === 0 ? 1 : -1; // alternate direction
    lasers.push({ x: Math.random() * (width - w), y, w, h, dir, speed: 1 + Math.random() * 1.5 });
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // simple move sound for navigation keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
      playTone(400, 0.05);
    }
    // resume audio on first interaction
    audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    // player movement (arrow keys / WASD)
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));

    // move lasers
    lasers.forEach(l => {
      l.x += l.dir * l.speed;
      if (l.x < 0 || l.x + l.w > width) l.dir *= -1;
    });

    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) endGame(false);

    // check collisions
    for (const l of lasers) {
      if (
        player.x + player.r > l.x &&
        player.x - player.r < l.x + l.w &&
        player.y + player.r > l.y &&
        player.y - player.r < l.y + l.h
      ) {
        endGame(false);
        return;
      }
    }
    // check exit
    if (
      player.x > exit.x && player.x < exit.x + exit.w &&
      player.y > exit.y && player.y < exit.y + exit.h
    ) {
      endGame(true);
    }
  }

  let gameOver = false;
  function endGame(win) {
    if (gameOver) return;
    gameOver = true;
    // play sound effect
    playTone(win ? 800 : 200, 0.2);
    ctx.fillStyle = win ? 'lime' : 'red';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(win ? 'YOU ESCAPED' : 'GAME OVER', width / 2, height / 2);
    clearInterval(loop);
  }

  function draw() {
    // fade trail effect
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, width, height);
    // neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // neon lasers with glow
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 12;
    lasers.forEach(l => ctx.fillRect(l.x, l.y, l.w, l.h));
    ctx.shadowBlur = 0;
    // pulsing exit portal
    const pulse = Math.abs(Math.sin(performance.now() / 300));
    ctx.fillStyle = `rgba(0,255,255,${0.5 + 0.5 * pulse})`;
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    // player with neon glow
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 4);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(0.6, '#0044ff');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // timer
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Time: ${Math.max(0, timeLeft.toFixed(1))}`, 10, 20);
  }

  let last = performance.now();
  const loop = setInterval(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
  }, 16);
})();
