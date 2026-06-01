// Neon Runner – simple infinite runner using the canvas with id="game"
// Controls: Arrow Up (jump), Arrow Down (slide)
// The player is a rectangle; obstacles are simple rectangles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill the window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
  };
  window.addEventListener('resize', resize);
  resize();

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SLIDE_TIME = 500; // ms
  const OBSTACLE_SPEED = 6;
  const OBSTACLE_INTERVAL = 1500; // ms

  // Player state
  const player = {
    width: 40,
    height: 80,
    x: 100,
    y: 0,
    vy: 0,
    onGround: false,
    sliding: false,
    slideTimer: 0,
    color: '#0ff',
  };

  // Obstacles and stars
  const obstacles = [];
  const stars = [];
  function generateStars() {
    stars.length = 0;
    const starCount = Math.min(200, Math.floor(canvas.width * canvas.height / 20000));
    const neonColors = ['#0ff', '#f0f', '#ff0', '#0f0', '#f00'];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        color: neonColors[Math.floor(Math.random() * neonColors.length)],
      });
    }
  }
  generateStars();

  // Spawn obstacles
  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'low' : 'high'; // low: jump over, high: slide under
    const width = 30 + Math.random() * 20;
    const height = type === 'low' ? 30 : 120;
    const y = type === 'low'
      ? canvas.height - height
      : canvas.height - player.height - 20;
    obstacles.push({ x: canvas.width + width, y, width, height, type, passed: false });
  }

  // Audio helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('pointerdown', resumeAudio, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000 + 0.02);
  }
  const playJumpSound = () => playTone(600, 100);
  const playSlideSound = () => playTone(300, 150);
  const playCrashSound = () => playTone(100, 300);
  // Background music – low‑frequency hum
  let bgOsc, bgGain;
  function startBackgroundMusic() {
    bgOsc = audioCtx.createOscillator();
    bgGain = audioCtx.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 40; // deep hum
    bgGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    bgGain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 1);
    bgOsc.connect(bgGain).connect(audioCtx.destination);
    bgOsc.start();
  }
  // Start music after first interaction
  const startMusicOnce = () => { startBackgroundMusic(); };
  window.addEventListener('keydown', startMusicOnce, { once: true });
  window.addEventListener('pointerdown', startMusicOnce, { once: true });

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp' && player.onGround && !player.sliding) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    }
    if (e.code === 'ArrowDown' && !player.sliding && player.onGround) {
      player.sliding = true;
      player.slideTimer = SLIDE_TIME;
      player.height = 40; // reduced height while sliding
      playSlideSound();
    }
  });

  let lastTime = 0;
  let obstacleTimer = 0;
  let score = 0;
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    const groundY = canvas.height - player.height;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }
    // Slide timer
    if (player.sliding) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) {
        player.sliding = false;
        player.height = 80; // restore height
      }
    }
    // Obstacles logic
    obstacleTimer += dt;
    if (obstacleTimer >= OBSTACLE_INTERVAL) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // Collision detection
      if (!o.passed &&
          player.x < o.x + o.width &&
          player.x + player.width > o.x &&
          player.y < o.y + o.height &&
          player.y + player.height > o.y) {
        playCrashSound();
        gameOver = true;
      }
      // Score when passing
      if (!o.passed && o.x + o.width < player.x) {
        o.passed = true;
        score++;
      }
      // Remove off‑screen obstacles
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
      }
    }
  }

  function render() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with neon glow and rounded corners
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    // Gradient for player
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#00f');
    ctx.fillStyle = playerGrad;
    // Rounded rectangle path
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.width - r, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + r);
    ctx.lineTo(player.x + player.width, player.y + player.height - r);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - r, player.y + player.height);
    ctx.lineTo(player.x + r, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw neon stars with glow
    for (const s of stars) {
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw obstacles with rounded neon glow
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.height);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#a0a');
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 12;
      ctx.fillStyle = grad;
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.width - r, o.y);
      ctx.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + r);
      ctx.lineTo(o.x + o.width, o.y + o.height - r);
      ctx.quadraticCurveTo(o.x + o.width, o.y + o.height, o.x + o.width - r, o.y + o.height);
      ctx.lineTo(o.x + r, o.y + o.height);
      ctx.quadraticCurveTo(o.x, o.y + o.height, o.x, o.y + o.height - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // UI – score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 20, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f55';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
