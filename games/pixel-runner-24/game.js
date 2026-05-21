// Simple endless runner based on IDEA.md
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 30;
  const OBSTACLE_WIDTH = 20;
  const GAP_WIDTH = 80;
  const SPEED = 4;

  // Audio context and simple tone generators
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const jumpSound = () => playTone(440);
  const crashSound = () => playTone(150, 0.4);

  // Player state
  const player = { x: 50, y: height - PLAYER_SIZE, vy: 0, onGround: true };

  // Obstacles and gaps (store x position and type)
  const elements = [];
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 90; // frames

  // Input handling (click or tap)
  const onJump = () => {
    if (player.onGround) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      jumpSound();
    }
  };
  canvas.addEventListener('click', onJump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); onJump(); });

  function spawnElement() {
    // Randomly decide obstacle or gap
    const type = Math.random() < 0.7 ? 'obstacle' : 'gap';
    const x = width;
    const w = type === 'obstacle' ? OBSTACLE_WIDTH : GAP_WIDTH;
    elements.push({ type, x, w, passed: false });
  }

  function update() {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + PLAYER_SIZE >= height) {
      player.y = height - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    }

    // Spawn logic
    spawnTimer++;
    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnTimer = 0;
      spawnElement();
    }

    // Update obstacles/gaps
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      el.x -= SPEED;
      // Collision detection for obstacles
      if (el.type === 'obstacle' &&
          player.x < el.x + el.w &&
          player.x + PLAYER_SIZE > el.x &&
          player.y + PLAYER_SIZE > height - PLAYER_SIZE) {
        // Simple ground collision (player runs on ground line)
        // If player is on ground and hits obstacle, game over.
        gameOver();
        return;
      }
      // Remove off‑screen elements
      if (el.x + el.w < 0) {
        elements.splice(i, 1);
      }
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawPlayer();
    drawElements();
  }

  // Draw a sky gradient, moving stars, and floating clouds
  function drawBackground() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#4682b4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars (re‑use elements array for simple background stars)
    if (!window._stars) {
      window._stars = [];
      for (let i = 0; i < 50; i++) {
        window._stars.push({ x: Math.random() * width, y: Math.random() * height * 0.5, r: Math.random() * 2 + 1 });
      }
    }
    ctx.fillStyle = '#fff';
    window._stars.forEach(s => {
      s.x -= 0.5; // move left slowly
      if (s.x < 0) s.x = width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Clouds – simple fluffy shapes
    if (!window._clouds) {
      window._clouds = [];
      for (let i = 0; i < 8; i++) {
        const cw = 60 + Math.random() * 40; // cloud width
        const ch = 30 + Math.random() * 20; // cloud height
        window._clouds.push({ x: Math.random() * width, y: Math.random() * height * 0.3, w: cw, h: ch });
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    window._clouds.forEach(c => {
      c.x -= 0.2; // slower than stars
      if (c.x + c.w < 0) c.x = width;
      // draw cloud as several overlapping circles
      const cx = c.x;
      const cy = c.y;
      const w = c.w;
      const h = c.h;
      ctx.beginPath();
      ctx.arc(cx + w * 0.2, cy + h * 0.5, h * 0.4, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.5, cy + h * 0.4, h * 0.5, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.8, cy + h * 0.5, h * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw the player as a rounded block with a simple gradient
  function drawPlayer() {
    const grad = ctx.createLinearGradient(0, player.y, 0, player.y + PLAYER_SIZE);
    grad.addColorStop(0, '#00ff00');
    grad.addColorStop(1, '#006400');
    ctx.fillStyle = grad;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + PLAYER_SIZE - radius, player.y);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y, player.x + PLAYER_SIZE, player.y + radius);
    ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE - radius);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE, player.x + PLAYER_SIZE - radius, player.y + PLAYER_SIZE);
    ctx.lineTo(player.x + radius, player.y + PLAYER_SIZE);
    ctx.quadraticCurveTo(player.x, player.y + PLAYER_SIZE, player.x, player.y + PLAYER_SIZE - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
  }

  // Draw obstacles (red) and indicate gaps by leaving sky visible
  function drawElements() {
    // Ground line with texture
    ctx.fillStyle = '#222';
    ctx.fillRect(0, height - PLAYER_SIZE, width, 4);
    ctx.fillStyle = '#a00';
    elements.forEach(el => {
      if (el.type === 'obstacle') {
        // obstacle with gradient
    const obsGrad = ctx.createLinearGradient(el.x, height - PLAYER_SIZE, el.x, height);
    obsGrad.addColorStop(0, '#ff4d4d');
    obsGrad.addColorStop(1, '#800000');
    ctx.fillStyle = obsGrad;
    ctx.fillRect(el.x, height - PLAYER_SIZE, el.w, PLAYER_SIZE);
      }
      // gaps are simply left as sky – no extra drawing needed
    });
  }

  let animationId;
  function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function gameOver() {
    cancelAnimationFrame(animationId);
    crashSound();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
    // Remove input listeners to prevent further jumps
    canvas.removeEventListener('click', onJump);
    canvas.removeEventListener('touchstart', onJump);
  }

  // Start the game loop
  loop();
})();
