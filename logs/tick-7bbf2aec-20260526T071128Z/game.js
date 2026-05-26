// Pixel Runner - simple endless runner
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill window
  const setSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Reinitialize background elements for new size
    initStars();
    initClouds();
  };
  setSize();
  window.addEventListener('resize', setSize);

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 30;
  const GROUND_HEIGHT = 50;
  const OBSTACLE_W = 30;
  const OBSTACLE_H = 60;
  const DOT_RADIUS = 8;
  const SPAWN_OBSTACLE_EVERY = 1500; // ms
  const SPAWN_DOT_EVERY = 2000; // ms
  const SCROLL_SPEED = 4;
  // Visual constants
  const CLOUD_SPEED = 1;
  const CLOUD_COUNT = 5;
  const STAR_COUNT = 100;

  // Helper to create stars
  const initStars = () => {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height - GROUND_HEIGHT),
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  };

  // Helper to create clouds
  const initClouds = () => {
    clouds = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const w = 80 + Math.random() * 120;
      const h = 30 + Math.random() * 20;
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        w,
        h,
      });
    }
  };

  // Draw sky gradient and background elements
  const drawBackground = () => {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height - GROUND_HEIGHT);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#00396b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Update background elements each frame
  const updateBackground = () => {
    // Move clouds leftward
    clouds.forEach(c => {
      c.x -= CLOUD_SPEED;
    });
    // Recycle off‑screen clouds
    clouds = clouds.filter(c => c.x + c.w > 0);
    while (clouds.length < CLOUD_COUNT) {
      const w = 80 + Math.random() * 120;
      const h = 30 + Math.random() * 20;
      clouds.push({
        x: canvas.width + Math.random() * 200,
        y: Math.random() * (canvas.height / 2),
        w,
        h,
      });
    }
  };

  // Player state
  const player = {
    x: 100,
    y: 0, // will be set on start
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    onGround: false,
  };

  // Game entities
  let obstacles = [];
  let dots = [];
  let stars = [];
  let clouds = [];
  let lastObstacle = 0;
  let lastDot = 0;
  let score = 0;
  let gameOver = false;

  const reset = () => {
    player.y = canvas.height - GROUND_HEIGHT - player.h;
    player.vy = 0;
    player.onGround = true;
    obstacles = [];
    dots = [];
    // Initialize background
    initStars();
    initClouds();
    lastObstacle = 0;
    lastDot = 0;
    score = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  };

  // Input handling
  // Set up audio context (will be resumed on first interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur = 0.1) => {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, now);
    osc.type = 'square';
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur);
  };
  const playJump = () => playTone(440);
  const playCollect = () => playTone(880);
  const playGameOver = () => playTone(110, 0.5);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      // Resume audio context on user interaction
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (player.onGround && !gameOver) {
        player.vy = JUMP_SPEED;
        player.onGround = false;
        playJump();
      } else if (gameOver) {
        reset();
      }
    }
  });

  // Utility
  const rectsCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const circleRectCollide = (c, r) => {
    const distX = Math.abs(c.x - r.x - r.w / 2);
    const distY = Math.abs(c.y - r.y - r.h / 2);
    if (distX > r.w / 2 + c.r) return false;
    if (distY > r.h / 2 + c.r) return false;
    if (distX <= r.w / 2) return true;
    if (distY <= r.h / 2) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= c.r * c.r;
  };

  // Main game loop
  const loop = (timestamp) => {
    if (gameOver) {
      // Show game over screen
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 70);
      return;
    }

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Update background elements (cloud movement)
    updateBackground();
    // Draw background sky gradient and stars
    drawBackground();

    // Update player
    player.vy += GRAVITY;
    player.y += player.vy;
    const groundY = canvas.height - GROUND_HEIGHT - player.h;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Draw player
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Spawn obstacles
    if (timestamp - lastObstacle > SPAWN_OBSTACLE_EVERY) {
      obstacles.push({
        x: canvas.width,
        y: canvas.height - GROUND_HEIGHT - OBSTACLE_H,
        w: OBSTACLE_W,
        h: OBSTACLE_H,
      });
      lastObstacle = timestamp;
    }

    // Spawn dots
    if (timestamp - lastDot > SPAWN_DOT_EVERY) {
      const dotY = canvas.height - GROUND_HEIGHT - PLAYER_SIZE - 100 - Math.random() * 150;
      dots.push({ x: canvas.width, y: dotY, r: DOT_RADIUS });
      lastDot = timestamp;
    }

    // Update and draw obstacles
    ctx.fillStyle = '#f00';
    obstacles.forEach((obs) => {
      obs.x -= SCROLL_SPEED;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      // Collision with player
      if (rectsCollide(player, obs)) {
        gameOver = true;
        playGameOver();
      }
    });
    // Remove off‑screen obstacles
    obstacles = obstacles.filter((obs) => obs.x + obs.w > 0);

    // Update and draw dots (collectibles)
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    dots.forEach((dot) => {
      dot.x -= SCROLL_SPEED;
      ctx.moveTo(dot.x + dot.r, dot.y);
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      // Collect
      if (circleRectCollide(dot, player)) {
        score += 10;
        dot.collected = true;
        playCollect();
      }
    });
    ctx.fill();
    // Remove collected or off‑screen dots
    dots = dots.filter((d) => !d.collected && d.x + d.r > 0);

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);

    requestAnimationFrame(loop);
  };

  // Start game
  reset();
})();
