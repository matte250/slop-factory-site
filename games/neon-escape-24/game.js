// Minimal Neon Escape endless runner
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const playTone = (freq, duration) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};
  // Full‑screen canvas
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; }; // keep full-screen
  resize();
  addEventListener('resize', resize);

    const player = { x: 80, y: canvas.height / 2, r: 8, dy: 0 };
    const particles = []; // trailing particles for glow effect
    const neonColors = ['#0ff', '#f0f', '#ff0']; // cycling colors for effect
  const obstacles = [];
  let speed = 2; // pixels per frame
  let frame = 0;
  let score = 0;
  let highScore = 0;
  let running = true;

  // Input handling
  const keys = {};
  addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { keys[e.key] = true; playTone(e.key === 'ArrowUp' ? 660 : 440, 0.05); } });
  addEventListener('keyup', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') keys[e.key] = false; });

  const update = () => {
    // player vertical movement
    player.dy = 0;
    if (keys['ArrowUp']) player.dy = -4;
    if (keys['ArrowDown']) player.dy = 4;
    player.y = Math.min(Math.max(player.y + player.dy, player.r), canvas.height - player.r);

    // obstacle generation
    if (frame % Math.max(80 - speed * 10, 30) === 0) {
      const gap = 120; // vertical gap size
      const gapY = Math.random() * (canvas.height - gap);
      obstacles.push({ x: canvas.width, w: 20, gapY, gap });
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision check
      if (
        player.x + player.r > o.x &&
        player.x - player.r < o.x + o.w &&
        (player.y - player.r < o.gapY || player.y + player.r > o.gapY + o.gap)
      ) {
        running = false;
        playTone(200, 0.3); // collision sound
      }
      // remove off‑screen
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
        highScore = Math.max(highScore, score);
      }
    }

    // generate trailing particle for player glow
    particles.push({
      x: player.x,
      y: player.y,
      life: 20,
      color: neonColors[frame % neonColors.length]
    });
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // speed up gradually
    speed += 0.001;
    frame++;
  };

  const draw = () => {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw trailing particles (glow effect)
    particles.forEach(p => {
      const alpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1; // reset

    // draw player with neon glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // draw obstacles with cycling neon colors
    obstacles.forEach((o, idx) => {
      const color = neonColors[(frame + idx) % neonColors.length];
      ctx.fillStyle = color;
      // top bar
      ctx.fillRect(o.x, 0, o.w, o.gapY);
      // bottom bar
      ctx.fillRect(o.x, o.gapY + o.gap, o.w, canvas.height - o.gapY - o.gap);
    });

    // draw scores
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 40);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    if (running) update();
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
