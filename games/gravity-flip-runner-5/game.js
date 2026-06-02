// Enhanced "Gravity Flip Runner" game with improved graphics
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.width || 800);
  const H = (canvas.height = canvas.height || 400);

  // Game constants
  const BALL_R = 15;
  const SPEED = 3; // obstacle scroll speed
  const GAP_H = 120; // vertical gap size
  const OBSTACLE_W = 30;
  const OBSTACLE_SPACING = 200; // distance between obstacles
  const GRAVITY = 0.6; // acceleration magnitude

  // Game state
  let gravityDown = true; // true => gravity pulls down, false => up
  let ballY = H - BALL_R; // start on floor
  let ballVY = 0; // vertical velocity
  const ballX = 80; // fixed horizontal position
  let obstacles = [];
  let frame = 0;
  let gameOver = false;

  // Input handling (space bar / click / touch)
  const flipSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAACABAAZGF0YQAAAAA='); // simple click
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAACABAAZGF0YQAAAAA='); // placeholder crash
  const toggleGravity = () => {
    gravityDown = !gravityDown;
    flipSound.currentTime = 0;
    flipSound.play();
  };
  document.addEventListener('keydown', e => { if (e.code === 'Space') toggleGravity(); });
  canvas.addEventListener('pointerdown', toggleGravity);

  const addObstacle = () => {
    // Gap centre ensures ball can pass both floor and ceiling
    const gapY = Math.random() * (H - GAP_H - 2 * BALL_R) + BALL_R + GAP_H / 2;
    obstacles.push({ x: W, gapY });
  };

  const update = () => {
    if (gameOver) return;
    frame++;
    // Spawn obstacles
    if (frame % Math.round(OBSTACLE_SPACING / SPEED) === 0) addObstacle();

    // Apply gravity
    ballVY += gravityDown ? GRAVITY : -GRAVITY;
    ballY += ballVY;
    // Clamp to floor / ceiling
    if (ballY > H - BALL_R) { ballY = H - BALL_R; ballVY = 0; }
    if (ballY < BALL_R) { ballY = BALL_R; ballVY = 0; }

    // Move obstacles
    obstacles.forEach(o => (o.x -= SPEED));
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + OBSTACLE_W > 0);

    // Collision detection – check horizontal overlap then vertical gap
    for (const o of obstacles) {
        if (ballX + BALL_R > o.x && ballX - BALL_R < o.x + OBSTACLE_W) {
          if (ballY - BALL_R < o.gapY - GAP_H / 2 || ballY + BALL_R > o.gapY + GAP_H / 2) {
            gameOver = true;
            gameOverSound.currentTime = 0;
            gameOverSound.play();
            break;
          }
        }
    }
  };

  const drawBackground = () => {
    // Vertical gradient sky
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#87CEEB'); // light sky
    grd.addColorStop(1, '#4682B4'); // deeper sky
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  };

  const drawBall = () => {
    // Radial gradient for a glossy ball
    const grad = ctx.createRadialGradient(ballX - BALL_R / 3, ballY - BALL_R / 3, BALL_R / 5, ballX, ballY, BALL_R);
    grad.addColorStop(0, '#FFF176');
    grad.addColorStop(1, '#F57C00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawObstacles = () => {
    ctx.fillStyle = '#212121';
    obstacles.forEach(o => {
      // top block
      ctx.fillRect(o.x, 0, OBSTACLE_W, o.gapY - GAP_H / 2);
      // bottom block
      ctx.fillRect(o.x, o.gapY + GAP_H / 2, OBSTACLE_W, H - (o.gapY + GAP_H / 2));
    });
  };

  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFF';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  };

  const draw = () => {
    drawBackground();
    drawObstacles();
    drawBall();
    if (gameOver) drawGameOver();
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Initialize first obstacles and start loop
  addObstacle();
  loop();
})();