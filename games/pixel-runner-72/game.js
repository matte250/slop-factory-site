// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
    if (!canvas) return console.error('Canvas #game not found');
    const ctx = canvas.getContext('2d');
    const WIDTH = canvas.width = canvas.offsetWidth || 800;
    const HEIGHT = canvas.height = canvas.offsetHeight || 200;

    // Audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, duration = 0.1) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    };
    const playJumpSound = () => playTone(300);
    const playGameOverSound = () => playTone(100, 0.5);

  // Background stars for visual depth
  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5,
    });
  }

  // Ground texture strips for parallax
  const groundStrips = [];
  const stripCount = 30;
  for (let i = 0; i < stripCount; i++) {
    groundStrips.push({
      x: i * (WIDTH / stripCount),
      w: WIDTH / stripCount + 2,
      speed: 1 + Math.random() * 0.5,
    });
  }

  // Player
  const player = {
    w: 20,
    h: 20,
    x: 50,
    y: HEIGHT - 20,
    vy: 0,
    jumpStrength: -7,
    color: '#0f0',
    onGround: true,
  };

  const GRAVITY = 0.4;

  // Obstacles (simple rectangles)
  const obstacles = [];
  const OBSTACLE_W = 20;
  const OBSTACLE_H = 40;
  const OBSTACLE_SPEED = 3;
  let obstacleTimer = 0;
  const OBSTACLE_INTERVAL = 90; // frames

  let score = 0;
  let running = true;
  let gameOverPlayed = false;

  // Input handling – space or mouse click
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('mousedown', jump);

  const update = () => {
    // Player physics
    // Move background stars for parallax effect
    for (let s of stars) {
      s.x -= s.speed;
      if (s.x < 0) s.x = WIDTH;
    }
    // Move ground texture strips for parallax effect
    for (let strip of groundStrips) {
      strip.x -= strip.speed;
      if (strip.x > WIDTH) strip.x = -strip.w;
    }
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= HEIGHT - player.h) {
      player.y = HEIGHT - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Spawn obstacles
    obstacleTimer++;
    if (obstacleTimer >= OBSTACLE_INTERVAL) {
      obstacleTimer = 0;
      const gapHeight = 60; // gap from ground
      obstacles.push({
        x: WIDTH,
        y: HEIGHT - OBSTACLE_H - gapHeight,
        w: OBSTACLE_W,
        h: OBSTACLE_H,
      });
    }

    // Move obstacles and check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // Collision detection
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        running = false; // lose condition
      }
      // Remove off‑screen obstacles
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#001');
    skyGrad.addColorStop(1, '#004');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw background stars
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ground texture strips
    ctx.fillStyle = '#333';
    for (let strip of groundStrips) {
      ctx.fillRect(strip.x, HEIGHT - 20, strip.w, 20);
    }
    // Ground with gradient overlay
    const groundGrad = ctx.createLinearGradient(0, HEIGHT - 20, 0, HEIGHT);
    groundGrad.addColorStop(0, '#444');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);
    // Player with rounded corners
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect?.(player.x, player.y, player.w, player.h, 4) ?? ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fill();
    // Obstacles with shading
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#ff5555');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const loop = () => {
    if (!running) {
      if (!gameOverPlayed) {
        playGameOverSound();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, WIDTH / 2, HEIGHT / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  loop();
})();
