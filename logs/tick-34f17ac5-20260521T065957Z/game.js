// Canvas Runner – simple endless runner
// Target canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Simple sound effects using data URLs
  const pointSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQgAAAAA'); // short click
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQgAAAAA'); // placeholder sound
  const { width, height } = canvas;

  // Player
  const player = {
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Obstacles
  const obstacles = [];
  const obstacleWidth = 40;
  const obstacleHeight = 20;
  const obstacleSpeed = 2;
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  // Score
  let score = 0;

  // Input handling
  const keyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = true;
  };
  const keyUp = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  const resetGame = () => {
    player.x = width / 2 - player.w / 2;
    player.y = height - 40;
    obstacles.length = 0;
    score = 0;
    obstacleTimer = 0;
    // Reset sounds (optional if needed)
  };

  const spawnObstacle = () => {
    const x = Math.random() * (width - obstacleWidth);
    obstacles.push({ x, y: -obstacleHeight, w: obstacleWidth, h: obstacleHeight });
  };

  const rectsCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    // Move player
    if (player.moveLeft) player.x = Math.max(0, player.x - player.speed);
    if (player.moveRight) player.x = Math.min(width - player.w, player.x + player.speed);

    // Spawn obstacles
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = obstacleInterval;
    } else {
      obstacleTimer--;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      // Remove off‑screen obstacles and increase score
      if (o.y > height) {
        obstacles.splice(i, 1);
        score++;
        pointSound.currentTime = 0;
        pointSound.play();
      } else if (rectsCollide(player, o)) {
        // Game over
        crashSound.currentTime = 0;
        crashSound.play();
        alert('Game Over! Score: ' + score);
        resetGame();
        break;
      }
    }
  };

  const drawBackground = () => {
    // Gradient sky background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#87ceeb'); // light sky
    grad.addColorStop(1, '#1e90ff'); // deep sky
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  };

  const drawPlayer = () => {
    ctx.fillStyle = '#0a84ff';
    // Rounded rectangle for smoother look
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
  };

  const drawObstacle = (o) => {
    ctx.fillStyle = '#ff3b30';
    const rad = 4;
    ctx.beginPath();
    ctx.moveTo(o.x + rad, o.y);
    ctx.lineTo(o.x + o.w - rad, o.y);
    ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + rad);
    ctx.lineTo(o.x + o.w, o.y + o.h - rad);
    ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - rad, o.y + o.h);
    ctx.lineTo(o.x + rad, o.y + o.h);
    ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - rad);
    ctx.lineTo(o.x, o.y + rad);
    ctx.quadraticCurveTo(o.x, o.y, o.x + rad, o.y);
    ctx.closePath();
    ctx.fill();
  };

  const draw = () => {
    drawBackground();
    // Draw player with rounded shape
    drawPlayer();
    // Draw obstacles with rounded corners
    obstacles.forEach(drawObstacle);
    // Draw score with shadow for readability
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('Score: ' + score, 10, 30);
    // Reset shadow
    ctx.shadowColor = 'transparent';
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Start the game loop
  loop();
})();
