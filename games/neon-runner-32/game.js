// Simple Neon Runner game based on IDEA.md
// Canvas with id "game" expected in HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800);
  const H = (canvas.height = 400);

  // Player
  const player = {
    x: W * 0.1,
    y: H - 30,
    w: 20,
    h: 20,
    vy: 0,
    onGround: true,
    color: '#0ff',
  };

  const GRAVITY = 0.6;
  const JUMP = -12;
  const SPEED = 4; // tunnel speed

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playBeep(800, 0.08); }
  function playCrashSound() { playBeep(200, 0.3); }


  // obstacles (spikes/gaps)
  const obstacles = [];
  let speed = SPEED;
  let frame = 0;
  let gameOver = false;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnObstacle() {
    // Randomly create a spike (rectangle) or a gap (skip a floor segment)
    const type = Math.random() < 0.6 ? 'spike' : 'gap';
    const size = 30 + Math.random() * 20;
    const x = W + size;
    if (type === 'spike') {
      obstacles.push({type, x, y: H - size, w: size, h: size, color: '#f0f'});
    } else {
      // gap: represent as a floor segment missing; we'll just treat as a gap width
      obstacles.push({type, x, w: size, gap: true});
    }
  }

  function update() {
    if (gameOver) return;
    frame++;
    // increase speed gradually
    if (frame % 600 === 0) speed += 0.5;
    // Player movement
    if (keys['ArrowLeft']) player.x -= 5;
    if (keys['ArrowRight']) player.x += 5;
    // Jump
    if (keys['Space'] && player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
      playJumpSound();
    }
    // Apply gravity
    player.vy += GRAVITY;
    player.y += player.vy;
    // Ground check
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;

    // Move obstacles
    obstacles.forEach(ob => (ob.x -= speed));
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + (obstacles[0].w || 0) < 0) obstacles.shift();
    // Spawn new obstacles
    if (frame % 120 === 0) spawnObstacle();

    // Collision detection
    for (const ob of obstacles) {
      if (ob.type === 'spike') {
        if (
          player.x < ob.x + ob.w &&
          player.x + player.w > ob.x &&
          player.y < ob.y + ob.h &&
          player.y + player.h > ob.y
        ) {
          playCrashSound();
          gameOver = true;
        }
      } else if (ob.gap) {
        // Gap: treat as missing floor between ob.x and ob.x+ob.w
        if (
          player.y + player.h >= H &&
          player.x + player.w > ob.x &&
          player.x < ob.x + ob.w
        ) {
          playCrashSound();
          gameOver = true;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Floor line with neon glow
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0ff';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset for other draws
    // Player with glow
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Obstacles with neon effect
    obstacles.forEach(ob => {
      if (ob.type === 'spike') {
        ctx.fillStyle = ob.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = ob.color;
        ctx.beginPath();
        ctx.moveTo(ob.x, H);
        ctx.lineTo(ob.x + ob.w / 2, ob.y);
        ctx.lineTo(ob.x + ob.w, H);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (ob.gap) {
        // gaps are empty space
      }
    });
    // Game over screen
    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
