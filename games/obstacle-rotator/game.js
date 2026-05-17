// Minimal Obstacle Rotator game
// Canvas with id="game" should exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const DOT_RADIUS = 8;
  const DOT_SPEED = 2; // pixels per frame
  const OBSTACLE_WIDTH = 80;
  const OBSTACLE_GAP = 30; // size of the gap on one side
  const OBSTACLE_SPACING = 200; // distance between obstacles
  const ROTATION_STEP = Math.PI / 2; // 90°

  let dot = { x: 50, y: canvas.height / 2 };
  let obstacles = [];
  let frame = 0;
  let gameOver = false;

  // Gap side: 0 = top, 1 = right, 2 = bottom, 3 = left
  function createObstacle(x) {
    const gapSide = Math.floor(Math.random() * 4);
    const y = Math.random() * (canvas.height - OBSTACLE_WIDTH);
    return { x, y, width: OBSTACLE_WIDTH, height: OBSTACLE_WIDTH, gapSide };
  }

  function initObstacles() {
    obstacles = [];
    for (let i = 1; i <= 5; i++) {
      obstacles.push(createObstacle(canvas.width + i * OBSTACLE_SPACING));
    }
  }

  function rotateAllObstacles() {
    obstacles.forEach(o => o.gapSide = (o.gapSide + 1) % 4);
  }

  function drawObstacle(ob) {
    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, ob.width, ob.height);
    ctx.clearRect(
      // clear gap depending on side
      ob.gapSide === 3 ? 0 : // left
        ob.gapSide === 0 ? 0 : // top (will be cleared later)
        ob.gapSide === 1 ? ob.width - OBSTACLE_GAP : // right
        ob.gapSide === 2 ? 0 : 0,
      ob.gapSide === 0 ? 0 : // top
        ob.gapSide === 1 ? 0 : // right
        ob.gapSide === 2 ? ob.height - OBSTACLE_GAP : // bottom
        ob.gapSide === 3 ? 0 : 0,
      ob.gapSide === 0 || ob.gapSide === 2 ? ob.width : OBSTACLE_GAP,
      ob.gapSide === 0 || ob.gapSide === 2 ? OBSTACLE_GAP : ob.height
    );
    ctx.restore();
  }

  function pointInObstacle(px, py, ob) {
    // Check if point is inside obstacle bounds
    if (px < ob.x || px > ob.x + ob.width || py < ob.y || py > ob.y + ob.height) return false;
    // Determine if point is within gap
    const gx = ob.x;
    const gy = ob.y;
    switch (ob.gapSide) {
      case 0: // top gap
        return !(py >= gy && py <= gy + OBSTACLE_GAP);
      case 1: // right gap
        return !(px >= gx + ob.width - OBSTACLE_GAP && px <= gx + ob.width);
      case 2: // bottom gap
        return !(py >= gy + ob.height - OBSTACLE_GAP && py <= gy + ob.height);
      case 3: // left gap
        return !(px >= gx && px <= gx + OBSTACLE_GAP);
    }
    return true;
  }

  function update() {
    if (gameOver) return;
    frame++;
    // Move dot forward
    dot.x += DOT_SPEED;
    // Move obstacles left relative to dot speed
    obstacles.forEach(o => (o.x -= DOT_SPEED));
    // Recycle obstacles
    if (obstacles[0].x + obstacles[0].width < 0) {
      obstacles.shift();
      const lastX = obstacles[obstacles.length - 1].x;
      obstacles.push(createObstacle(lastX + OBSTACLE_SPACING));
    }
    // Collision detection
    for (const ob of obstacles) {
      if (pointInObstacle(dot.x, dot.y, ob)) {
        gameOver = true;
        break;
      }
    }
    // Loop dot vertically (optional simple control)
    if (dot.y < DOT_RADIUS) dot.y = DOT_RADIUS;
    if (dot.y > canvas.height - DOT_RADIUS) dot.y = canvas.height - DOT_RADIUS;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw obstacles
    obstacles.forEach(drawObstacle);
    // Draw dot
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0';
    ctx.fill();
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Tap / click rotates obstacles
  canvas.addEventListener('click', () => {
    if (!gameOver) rotateAllObstacles();
    else { // restart
      dot = { x: 50, y: canvas.height / 2 };
      initObstacles();
      gameOver = false;
      requestAnimationFrame(loop);
    }
  });

  // Simple vertical control with arrow keys
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') dot.y -= 30;
    if (e.key === 'ArrowDown') dot.y += 30;
  });

  initObstacles();
  requestAnimationFrame(loop);
})();
