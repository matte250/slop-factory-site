// Simple Gravity Runner game
// Canvas with id="game" expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  // Audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playThrustSound = () => playTone(300, 0.08);
  const playCrashSound = () => playTone(100, 0.4);


  // Game constants
  const GRAVITY = 0.4;
  const THRUST = -8;
  const PLAYER_SIZE = 30;
  const OBSTACLE_WIDTH = 40;
  const OBSTACLE_GAP = 120; // vertical gap between top/bottom parts
  const OBSTACLE_SPACING = 200; // horizontal distance between obstacles
  const SPEED = 3;
  const STAR_COUNT = 50; // number of background stars
  const STAR_SPEED = 0.3; // horizontal speed of stars (parallax)

  // State
  let player = { x: 80, y: height / 2, vy: 0, w: PLAYER_SIZE, h: PLAYER_SIZE };
  let obstacles = [];
  let stars = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;
  let crashPlayed = false;


  // Input
  let thrustTimer = 0;
  const applyThrust = () => {
    // Ensure audio can play after user interaction
    audioCtx.resume();
    player.vy = THRUST;
    thrustTimer = 5; // show thrust flames for few frames
    playThrustSound();
  };
  canvas.addEventListener('mousedown', applyThrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); applyThrust(); });

  // Helper – AABB collision
  const collides = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Obstacle generation
  const addObstacle = () => {
    const gapY = Math.random() * (height - OBSTACLE_GAP - 40) + 20; // keep gap away from edges
    // Top obstacle
    obstacles.push({ x: width, y: 0, w: OBSTACLE_WIDTH, h: gapY });
    // Bottom obstacle
    obstacles.push({ x: width, y: gapY + OBSTACLE_GAP, w: OBSTACLE_WIDTH, h: height - gapY - OBSTACLE_GAP });
  };

  const update = () => {
    if (gameOver) return;
    frames++;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // Decrease thrust timer
    if (thrustTimer > 0) thrustTimer--;
    // Bounds check (lose if falls below canvas)
    if (player.y + player.h > height || player.y < 0) {
      gameOver = true;
    }
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SPEED;
      // Remove off‑screen obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision
      if (collides(player, o)) gameOver = true;
    }
    // Move stars for parallax
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= STAR_SPEED;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
    // Generate new obstacles
    if (frames % Math.floor(OBSTACLE_SPACING / SPEED) === 0) addObstacle();
    // Score increments with distance
    score = Math.floor(frames / 5);
    // Play crash sound once when game over occurs
    if (gameOver && !crashPlayed) {
      playCrashSound();
      crashPlayed = true;
    }
  };

  const draw = () => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars (parallax)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player (triangle ship with optional thrust flame)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h / 2);
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    if (thrustTimer > 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y + player.h / 2);
      ctx.lineTo(player.x - 10, player.y + player.h / 2 - 5);
      ctx.lineTo(player.x - 10, player.y + player.h / 2 + 5);
      ctx.closePath();
      ctx.fill();
    }
    // Obstacles (styled as dark rocks)
    ctx.fillStyle = '#444';
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // add slight inner shading
      ctx.fillStyle = '#222';
      ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
      ctx.fillStyle = '#444';
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Initialize stars
  const initStars = () => {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  };

  // Start the game
  initStars();
  addObstacle();
  requestAnimationFrame(loop);
})();
