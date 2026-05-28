// Neon Runner – simple endless runner on a canvas with id="game"
// Click or tap to make the orb jump. Avoid moving barriers.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');

// Resize canvas to fill its container
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  function playJump() { playTone(300, 100); }
  function playHit() { playTone(80, 300); }
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateStars();
  }
  }
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateStars();
  }
  window.addEventListener('resize', resize);
  resize();

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_RADIUS = 12;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 80; // vertical gap for the orb to pass
  const SPEED = 4;

  const player = { x: 60, y: canvas.height / 2, vy: 0, alive: true };
  let obstacles = [];
  let spawnTimer = 0;
  let score = 0;
  let lastTime = 0;

  function reset() {
    player.y = canvas.height / 2;
    player.vy = 0;
    player.alive = true;
    obstacles = [];
    spawnTimer = 0;
    score = 0;
    lastTime = performance.now();
  }

  function jump() {
    // ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (!player.alive) {
      reset();
      return;
    }
    player.vy = JUMP_VELOCITY;
    playJump();
  }

  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });

  function spawnObstacle() {
    const gapY = Math.random() * (canvas.height - OBSTACLE_GAP - 40) + 20;
    // top rect
    obstacles.push({ x: canvas.width, y: 0, w: OBSTACLE_WIDTH, h: gapY });
    // bottom rect
    obstacles.push({ x: canvas.width, y: gapY + OBSTACLE_GAP, w: OBSTACLE_WIDTH, h: canvas.height - (gapY + OBSTACLE_GAP) });
  }

  function update(dt) {
    if (!player.alive) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // floor/ceiling check
    if (player.y + PLAYER_RADIUS > canvas.height || player.y - PLAYER_RADIUS < 0) {
      if (audioCtx.state !== 'running') audioCtx.resume();
      playHit();
      player.alive = false;
    }
    // obstacles movement & spawn
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 1500; // ms until next
    }
    obstacles.forEach(o => o.x -= SPEED);
    // remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // collision detection
    for (const o of obstacles) {
      const withinX = player.x + PLAYER_RADIUS > o.x && player.x - PLAYER_RADIUS < o.x + o.w;
      const withinY = player.y + PLAYER_RADIUS > o.y && player.y - PLAYER_RADIUS < o.y + o.h;
      if (withinX && withinY) {
        if (audioCtx.state !== 'running') audioCtx.resume();
        playHit();
        player.alive = false;
        break;
      }
    }
    // score based on time survived
    score = Math.floor((performance.now() - lastTime) / 100);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars background
    ctx.fillStyle = '#222';
    // (stars drawn later)
    // stars – tiny flicker
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha * (0.5 + Math.random() * 0.5);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // player orb – neon glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // obstacles – neon bars with glow
    ctx.fillStyle = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.shadowBlur = 0;
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!player.alive) {
      ctx.fillStyle = '#f44';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  reset();
  requestAnimationFrame(loop);
})();
