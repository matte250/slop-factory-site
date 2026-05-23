// Simple endless‑runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800);
  const H = (canvas.height = 200);

    // Player (square character)
    const player = { x: 50, y: H - 30, w: 20, h: 20, vy: 0, jumpPower: -7, onGround: true };
  const GRAVITY = 0.4;

  // Game objects
  const obstacles = [];
  const stars = [];
  let frame = 0;
  let score = 0;
  let running = true;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // simple beep generator
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playTone(300, 0.1);
  const playCollect = () => playTone(800, 0.08);
  const playGameOver = () => playTone(150, 0.5);

  // Input
  const jump = () => {
    if (player.onGround) { player.vy = player.jumpPower; player.onGround = false; playJump(); }
  };
  document.addEventListener('keydown', (e) => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', () => { audioCtx.resume().then(() => jump()); });

  function spawnObstacle() {
    const w = 20 + Math.random() * 20;
    const h = 20 + Math.random() * 30;
    obstacles.push({ x: W, y: H - h, w, h });
  }
  function spawnStar() {
    const size = 8;
    stars.push({ x: W, y: H - 80 - Math.random() * 60, s: size });
  }

  function update() {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // Move obstacles & stars
    obstacles.forEach(o => o.x -= 3);
    stars.forEach(s => s.x -= 3);
    // Remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].s < 0) stars.shift();
    // Collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        running = false;
        playGameOver();
        }
      }

    // Collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (player.x < s.x + s.s && player.x + player.w > s.x &&
          player.y < s.y + s.s && player.y + player.h > s.y) {
        score++;
        stars.splice(i, 1);
      }
    }
    // Spawn logic
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 90 === 0) spawnStar();
    frame++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#e0f7fa'); // light cyan
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = '#555';
    ctx.fillRect(0, H - 20, W, 20);

    // Helper to draw rounded rectangle
    const drawRoundedRect = (x, y, w, h, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };

    // Draw player as a circle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles with rounded corners, random shade of red
    obstacles.forEach(o => {
      const shade = 200 + Math.floor(Math.random() * 55);
      drawRoundedRect(o.x, o.y, o.w, o.h, 4, `rgb(${shade},0,0)`);
    });

    // Stars as 5‑pointed stars
    const drawStar = (cx, cy, spikes, outerRadius, innerRadius, color) => {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    };
    stars.forEach(s => {
      drawStar(s.x + s.s / 2, s.y + s.s / 2, 5, s.s / 2, s.s / 4, '#ff0');
    });

    // Score with stroke for readability
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeText('Score: ' + score, 10, 20);
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over – Score: ' + score, W / 2, H / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
