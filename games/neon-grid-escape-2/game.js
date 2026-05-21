// Neon Grid Escape game
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioStarted = false;
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  // Full‑window canvas with neon background
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game state
  const player = { x: canvas.width / 2, y: canvas.height / 2, r: 10, speed: 4 };
  const nodes = [];
  const barriers = [];
  let score = 0;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const spawnNode = () => {
    const size = 6;
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: size,
    });
  };

  const spawnBarrier = () => {
    // Horizontal barrier sweeping vertically
    const dir = Math.random() < 0.5 ? 'h' : 'v';
    if (dir === 'h') {
      barriers.push({
        x: 0,
        y: Math.random() * canvas.height,
        w: canvas.width,
        h: 8,
        dy: 2 + Math.random() * 2,
      });
    } else {
      barriers.push({
        x: Math.random() * canvas.width,
        y: 0,
        w: 8,
        h: canvas.height,
        dx: 2 + Math.random() * 2,
      });
    }
  };

  // Initial spawns
  for (let i = 0; i < 5; i++) spawnNode();
  for (let i = 0; i < 2; i++) spawnBarrier();

  const drawGrid = () => {
    const step = 40;
    // animate offset for a subtle moving grid effect
    const offset = Math.sin((performance.now() - startTime) * 0.001) * step;
    ctx.strokeStyle = 'rgba(0,255,180,0.2)';
    ctx.lineWidth = 1.5;
    for (let x = -step; x <= canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset, canvas.height);
      ctx.stroke();
    }
    for (let y = -step; y <= canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(canvas.width, y + offset);
      ctx.stroke();
    }
  };

  const update = () => {
    if (!running) return;
    // Move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside bounds (lose if off grid)
    if (player.x < 0 || player.x > canvas.width || player.y < 0 || player.y > canvas.height) {
      running = false;
      playTone(120, 0.4); // game over tone
    }
    // Move barriers
    barriers.forEach(b => {
      if (b.dy) {
        b.y += b.dy;
        if (b.y > canvas.height) b.y = -b.h;
      } else if (b.dx) {
        b.x += b.dx;
        if (b.x > canvas.width) b.x = -b.w;
      }
    });
    // Check collisions with barriers
    for (const b of barriers) {
      const withinX = player.x + player.r > b.x && player.x - player.r < b.x + b.w;
      const withinY = player.y + player.r > b.y && player.y - player.r < b.y + b.h;
      if (withinX && withinY) {
        running = false;
        playTone(150, 0.5); // barrier hit tone
        break;
      }
    }
    // Check node collection
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = player.x - n.x;
      const dy = player.y - n.y;
      if (Math.hypot(dx, dy) < player.r + n.r) {
        nodes.splice(i, 1);
        score++;
        playTone(300, 0.2); // node collect tone
        spawnNode();
      }
    }
    // Occasionally add new barriers
    if (Math.random() < 0.005) spawnBarrier();
  };

  let startTime = performance.now();
const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001025');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    // Player
ctx.shadowColor = 'rgba(0,255,255,0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    // Nodes with neon glow
    nodes.forEach(n => {
      ctx.shadowColor = 'rgba(255,255,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // Barriers with neon red glow
    barriers.forEach(b => {
      ctx.shadowColor = 'rgba(255,0,0,0.8)';
      ctx.shadowBlur = 10;
      const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      grad.addColorStop(0, 'rgba(255,80,80,0.9)');
      grad.addColorStop(1, 'rgba(200,0,0,0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 20, 30);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
