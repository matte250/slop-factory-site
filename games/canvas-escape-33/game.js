// Canvas Escape – enhanced graphics
// Targets <canvas id="game"></canvas>

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  };
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };

  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Ship state (triangular ship)
  const ship = { x: 50, y: height / 2, size: 14, vy: 0 };
  // Star fields for parallax background
  const stars = [];
  const farStars = [];
  const STAR_COUNT = 80;
  const STAR_SPEED = 0.5;
  const FAR_STAR_SPEED = 0.2;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      alpha: 0.5 + Math.random() * 0.5,
    });
    farStars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      alpha: 0.3 + Math.random() * 0.4,
    });
  }
  const GRAVITY = 0.4;
  const THRUST = -8;

  // Obstacles – simple rectangles
  const obstacles = [];
  const OBSTACLE_WIDTH = 30;
  const GAP_HEIGHT = 100;
  const OBSTACLE_SPACING = 200; // px between starts
  let obstacleTimer = 0;

  let score = 0;
  let gameOver = false;

  // Input
  const thrust = () => { resumeAudio(); playTone(600, 0.08); ship.vy = THRUST; };
  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); });

  // Trail of previous ship positions for motion blur
  const trail = [];
  const MAX_TRAIL = 8;

  const update = () => {
    if (gameOver) return;
    // Ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    // Record trail
    trail.push({ x: ship.x, y: ship.y });
    if (trail.length > MAX_TRAIL) trail.shift();
    // Bounds
    if (ship.y - ship.size > height || ship.y + ship.size < 0) {
      playTone(200, 0.3);
      gameOver = true;
    }
    // Update stars twinkle and motion
    stars.forEach(s => {
      s.x -= STAR_SPEED;
      if (s.x < 0) s.x = width;
      s.alpha = 0.5 + Math.random() * 0.5;
    });
    farStars.forEach(s => {
      s.x -= FAR_STAR_SPEED;
      if (s.x < 0) s.x = width;
    });
    // Obstacles
    obstacleTimer += 1;
    if (obstacleTimer * 2 > OBSTACLE_SPACING) { // speed factor
      obstacleTimer = 0;
      const gapY = Math.random() * (height - GAP_HEIGHT - 40) + 20;
      obstacles.push({ x: width, gapY });
    }
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 2; // scroll speed
      // Collision detection
      if (!gameOver && o.x < ship.x + ship.size && o.x + OBSTACLE_WIDTH > ship.x - ship.size) {
        if (ship.y - ship.size < o.gapY || ship.y + ship.size > o.gapY + GAP_HEIGHT) {
          playTone(200, 0.3);
          gameOver = true;
        }
      }
      // Remove off-screen
      if (o.x + OBSTACLE_WIDTH < 0) obstacles.splice(i, 1);
    }
    // Score
    score = Math.floor(performance.now() / 1000);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    // Trail (motion blur)
    ctx.fillStyle = 'rgba(0,255,255,0.3)';
    trail.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, ship.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size / 2);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    // Obstacles
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      // top
      ctx.fillRect(o.x, 0, OBSTACLE_WIDTH, o.gapY);
      // bottom
      ctx.fillRect(o.x, o.gapY + GAP_HEIGHT, OBSTACLE_WIDTH, height - (o.gapY + GAP_HEIGHT));
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
