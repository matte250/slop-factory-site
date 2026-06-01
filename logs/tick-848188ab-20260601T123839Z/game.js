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
  // Set canvas size to fill the window
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

  // Obstacles array
  const obstacles = [];
  // Star field for background
  const stars = [];
  function generateStars() {
    stars.length = 0;
    const starCount = Math.min(200, Math.floor(canvas.width * canvas.height / 20000));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
      });
    }
  }
  // Generate stars initially and on resize
  generateStars();

  // Helper to create obstacle
  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'low' : 'high'; // low: requires jump, high: requires slide
    const width = 30 + Math.random() * 20;
    const height = type === 'low' ? 30 : 120;
    const y = type === 'low' ? canvas.height - height : canvas.height - player.height - 20; // high obstacle placed where player would hit if not sliding
    obstacles.push({ x: canvas.width + width, y, width, height, type, passed: false });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
  function playJumpSound() { playTone(600, 100); }
  function playSlideSound() { playTone(300, 150); }
  function playCrashSound() { playTone(100, 300); }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp' && player.onGround && !player.sliding) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    }
    if (e.code === 'ArrowDown' && !player.sliding && player.onGround) {
      player.sliding = true;
      player.slideTimer = SLIDE_TIME;
      // Reduce height while sliding
      player.height = 40;
      playSlideSound();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
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
    // ground check
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
    // Obstacles
    obstacleTimer += dt;
    if (obstacleTimer >= OBSTACLE_INTERVAL) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // Collision detection (simple AABB)
      if (!o.passed &&
          player.x < o.x + o.width &&
          player.x + player.width > o.x &&
          player.y < o.y + o.height &&
          player.y + player.height > o.y) {
        // Collision – game over
        playCrashSound();
        gameOver = true;
      }
      // Score when passing obstacle
      if (!o.passed && o.x + o.width < player.x) {
        o.passed = true;
        score++;
      }
      // Remove off‑screen
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
      }
    }
  }

  function render() {
    // Clear background with neon gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw player with neon glow and rounded edges
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    const radius = 8;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.width - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + radius);
    ctx.lineTo(player.x + player.width, player.y + player.height - radius);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height);
    ctx.lineTo(player.x + radius, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Draw star field background
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw obstacles with neon glow
    obstacles.forEach(o => {
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#f0f';
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.shadowBlur = 0;
    });
    // Draw score
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
