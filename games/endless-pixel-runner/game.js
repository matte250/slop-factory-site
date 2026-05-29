// Endless Pixel Runner
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 400);
  const height = (canvas.height = canvas.clientHeight || 200);

  // game settings
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 200) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -10;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const GAP_WIDTH = 40;
  const ORB_RADIUS = 6;
  const SPAWN_INTERVAL = 1500; // ms

  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  const player = {
    x: 50,
    y: height - PLAYER_SIZE,
    vy: 0,
    onGround: true,
    draw() {
      // player with gradient and rounded corners
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + PLAYER_SIZE);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(this.x + r, this.y);
      ctx.lineTo(this.x + PLAYER_SIZE - r, this.y);
      ctx.quadraticCurveTo(this.x + PLAYER_SIZE, this.y, this.x + PLAYER_SIZE, this.y + r);
      ctx.lineTo(this.x + PLAYER_SIZE, this.y + PLAYER_SIZE - r);
      ctx.quadraticCurveTo(this.x + PLAYER_SIZE, this.y + PLAYER_SIZE, this.x + PLAYER_SIZE - r, this.y + PLAYER_SIZE);
      ctx.lineTo(this.x + r, this.y + PLAYER_SIZE);
      ctx.quadraticCurveTo(this.x, this.y + PLAYER_SIZE, this.x, this.y + PLAYER_SIZE - r);
      ctx.lineTo(this.x, this.y + r);
      ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent';
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + PLAYER_SIZE >= height) {
        this.y = height - PLAYER_SIZE;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
  };

  const obstacles = [];
  const gaps = [];
  const orbs = [];

  function spawn() {
    // randomly decide obstacle or gap
    const type = Math.random() < 0.7 ? 'obstacle' : 'gap';
    const x = width;
    if (type === 'obstacle') {
      obstacles.push({ x, y: height - PLAYER_SIZE, w: OBSTACLE_WIDTH, h: PLAYER_SIZE });
    } else {
      gaps.push({ x, w: GAP_WIDTH, passed: false });
    }
    // occasionally spawn an orb
    if (Math.random() < 0.3) {
      const orbY = height - PLAYER_SIZE - 30 - Math.random() * 60;
      orbs.push({ x, y: orbY, collected: false });
    }
  }

  function updateElements(delta) {
    const speed = 3; // pixels per frame
    obstacles.forEach(o => (o.x -= speed));
    gaps.forEach(g => (g.x -= speed));
    orbs.forEach(o => (o.x -= speed));
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (gaps.length && gaps[0].x + gaps[0].w < 0) gaps.shift();
    while (orbs.length && orbs[0].x < 0) orbs.shift();
  }

  function checkCollisions() {
    // obstacle collision
    for (const o of obstacles) {
if (
          player.x < o.x + o.w &&
          player.x + PLAYER_SIZE > o.x &&
          player.y < o.y + o.h &&
          player.y + PLAYER_SIZE > o.y
        ) {
          playTone(200, 300);
          gameOver = true;
          return;
        }
    }
    // gap detection – treat gap as missing ground segment
    for (const g of gaps) {
      const inGap = player.x + PLAYER_SIZE > g.x && player.x < g.x + g.w;
if (inGap && player.y + PLAYER_SIZE >= height) {
          playTone(200, 300);
          gameOver = true;
          return;
        }
    }
    // collect orbs
    for (const orb of orbs) {
      if (!orb.collected) {
        const dx = player.x + PLAYER_SIZE / 2 - (orb.x + ORB_RADIUS);
        const dy = player.y + PLAYER_SIZE / 2 - (orb.y + ORB_RADIUS);
        if (dx * dx + dy * dy < (PLAYER_SIZE / 2 + ORB_RADIUS) ** 2) {
          orb.collected = true;
          score += 10;
        }
      }
    }
  }

  function drawBackground() {
    // sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#1e3a8a'); // dark blue
    sky.addColorStop(1, '#3b82f6'); // light blue
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPlayer() {
    // player with gradient and shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + PLAYER_SIZE);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + radius, this.y);
    ctx.lineTo(this.x + PLAYER_SIZE - radius, this.y);
    ctx.quadraticCurveTo(this.x + PLAYER_SIZE, this.y, this.x + PLAYER_SIZE, this.y + radius);
    ctx.lineTo(this.x + PLAYER_SIZE, this.y + PLAYER_SIZE - radius);
    ctx.quadraticCurveTo(this.x + PLAYER_SIZE, this.y + PLAYER_SIZE, this.x + PLAYER_SIZE - radius, this.y + PLAYER_SIZE);
    ctx.lineTo(this.x + radius, this.y + PLAYER_SIZE);
    ctx.quadraticCurveTo(this.x, this.y + PLAYER_SIZE, this.x, this.y + PLAYER_SIZE - radius);
    ctx.lineTo(this.x, this.y + radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }

  function draw() {
    // draw sky background
    drawBackground();
    // draw ground gradient
    const groundGrad = ctx.createLinearGradient(0, height - 20, 0, height);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#111');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height - 20, width, 20);
    // draw player (gradient handled)
    player.draw();
    // draw obstacles with gradient
    const obsGrad = ctx.createLinearGradient(0, height - PLAYER_SIZE, 0, height);
    obsGrad.addColorStop(0, '#ff5555');
    obsGrad.addColorStop(1, '#aa0000');
    ctx.fillStyle = obsGrad;
    for (const o of obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
    // draw orbs with glow effect
    for (const orb of orbs) {
      if (!orb.collected) {
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, ORB_RADIUS + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,0,0.3)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.fill();
      }
    }
    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop(timestamp) {
    if (gameOver) { draw(); return; }
    const delta = timestamp - (lastSpawn || timestamp);
    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
      spawn();
      lastSpawn = timestamp;
    }
    player.update();
    updateElements(delta);
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.onGround && !gameOver) {
      // ensure audio context is running
      audioCtx.resume();
      playTone(440, 150); // jump sound
      player.vy = JUMP_VELOCITY;
    }
    if (e.code === 'Enter' && gameOver) location.reload();
  });

  // start
  requestAnimationFrame(loop);
})();
