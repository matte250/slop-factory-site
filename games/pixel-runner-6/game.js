// Pixel Runner - minimal implementation
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 800;
  const h = canvas.height = canvas.offsetHeight || 400;

  // Game state
  let running = true;
  let score = 0;
  const speed = 4; // ground scroll speed

  // Player
  const player = {
    x: 50,
    y: h - 60,
    w: 30,
    h: 30,
    vy: 0,
    jumpStrength: -12,
    onGround: true,
    color: '#ff0'
  };

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 120; // frames
  let frameCount = 0;

  // Input
  const jump = () => {
    // Ensure audio context is running (user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    playTone(440, 0.1); // jump sound
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
    }
  };
  window.addEventListener('mousedown', jump);
  window.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  function spawnObstacle() {
    const gap = Math.random() * 40 + 20;
    const height = Math.random() * 30 + 20;
    obstacles.push({ x: w, w: 20, h: height, gap, color: '#f44' });
  }

  function update() {
    if (!running) return;
    frameCount++;
    // Player physics
    player.vy += 0.6; // gravity
    player.y += player.vy;
    if (player.y + player.h >= h) {
      player.y = h - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // Obstacles movement and generation
    if (frameCount % obstacleFreq === 0) spawnObstacle();
    obstacles.forEach(ob => ob.x -= speed);
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
      obstacles.shift();
      score++;
      playTone(880, 0.05); // point sound
    }
    // Collision detection
    for (const ob of obstacles) {
      if (player.x < ob.x + ob.w && player.x + player.w > ob.x &&
          player.y + player.h > h - ob.gap) {
        // Simple top collision (player hits obstacle)
        if (player.y < h - ob.gap) { playTone(200, 0.2); running = false; }
      }
    }
    // Gap fall detection (player falls into gap)
    const currentOb = obstacles.find(ob => ob.x < player.x + player.w && ob.x + ob.w > player.x);
    if (currentOb) {
      const groundY = h - currentOb.gap;
      if (player.y + player.h > groundY && player.y < groundY) {
        // player is over gap, let gravity pull down (already handled)
        if (player.y + player.h >= h) running = false; // fell off screen
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0,0,w,0);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#4682B4');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,w,h);
    // Ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, h - 30, w, 30);
    // Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Obstacles
    obstacles.forEach(ob => {
      ctx.fillStyle = ob.color;
      // Draw block
      ctx.fillRect(ob.x, h - ob.gap - ob.h, ob.w, ob.h);
      // Draw gap floor (optional visual)
      ctx.fillStyle = '#555';
      ctx.fillRect(ob.x, h - ob.gap, ob.w, 20);
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', w/2-60, h/2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
