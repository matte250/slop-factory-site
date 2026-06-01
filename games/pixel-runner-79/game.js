// Minimal endless runner for canvas#game
// Enhanced graphics: background gradient, rounded player, spiky obstacles

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur / 1000);
  };
  const playJumpSound = () => playTone(400, 150);
  const playGameOverSound = () => playTone(120, 500);

  // Full‑screen canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - 60;
  };
  let groundY = 0;
  resize();
  window.addEventListener('resize', resize);

  // Player definition
  const player = {
    x: 80,
    y: 0,
    w: 30,
    h: 30,
    vy: 0,
    onGround: false,
  };

  const gravity = 0.6;
  const jumpStrength = -12;
  const speed = 5; // world scroll speed

  // Obstacles array
  const obstacles = [];
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms

  let running = true;
  let lastTime = 0;

  // Input handling – click/tap or space bar
  const tryJump = () => {
    if (player.onGround && running) {
      // Ensure audio context is resumed (required by some browsers)
      if (audioCtx.state === 'suspended') audioCtx.resume();
      player.vy = jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  };
  window.addEventListener('mousedown', tryJump);
  window.addEventListener('touchstart', tryJump);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') tryJump();
  });

  const spawnObstacle = () => {
    const height = 30 + Math.random() * 40; // 30‑70px tall
    const width = 20 + Math.random() * 20; // 20‑40px wide
    obstacles.push({
      x: canvas.width,
      y: groundY - height,
      w: width,
      h: height,
    });
  };

  const rectCollision = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  function update(dt) {
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Move obstacles left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision check
      if (rectCollision(player, o)) {
        running = false;
        playGameOverSound();
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#87CEEB'); // sky blue
    bgGrad.addColorStop(1, '#fff'); // near white ground
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground fill
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    // Ground line with slight thickness
    ctx.fillStyle = '#555';
    ctx.fillRect(0, groundY, canvas.width, 4);
    // Helper for rounded rectangle
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

    // Player with rounded corners
    drawRoundedRect(player.x, player.y, player.w, player.h, 6, '#0f0');

    // Obstacles – draw as spikes (triangular tops) with base rectangle
    obstacles.forEach(o => {
      // base rectangle
      ctx.fillStyle = '#b00';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // spike triangle on top
      const spikeHeight = Math.min(o.w, 15);
      ctx.fillStyle = '#f33';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + o.w / 2, o.y - spikeHeight);
      ctx.lineTo(o.x + o.w, o.y);
      ctx.closePath();
      ctx.fill();
    });

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
