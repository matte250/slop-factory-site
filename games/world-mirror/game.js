// Simple "World Mirror" canvas game implementation
// Canvas with id="game" is expected in the HTML.
// The player is a dot that moves forward (upwards) through a scrolling tunnel.
// Obstacles appear on left or right side. A tap/click mirrors the upcoming obstacles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to its displayed dimensions
  const setSize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  setSize();
  window.addEventListener('resize', setSize);

  // Game parameters
  const player = { radius: 8, x: canvas.width / 2, y: canvas.height - 30 };
  const speed = 2; // pixels per frame (tunnel scroll)
  const obstacleWidth = canvas.width / 2 - 20;
  const obstacleHeight = 20;
  const spawnInterval = 120; // frames
  let frameCount = 0;
  const obstacles = [];

  // Helper to create an obstacle on a random side (0:left, 1:right)
  const createObstacle = () => {
    const side = Math.random() < 0.5 ? 0 : 1;
    const x = side === 0 ? 0 : canvas.width / 2 + 20;
    obstacles.push({ x, y: -obstacleHeight, width: obstacleWidth, height: obstacleHeight });
  };

  // Mirror function – swaps left/right positions of all current obstacles
  const mirrorObstacles = () => {
    obstacles.forEach(ob => {
      // if on left side (x===0) move to right, otherwise move to left
      if (ob.x === 0) {
        ob.x = canvas.width / 2 + 20;
      } else {
        ob.x = 0;
      }
    });
  };

  // Input handling – click/tap anywhere on the canvas triggers mirror
  canvas.addEventListener('click', mirrorObstacles);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); mirrorObstacles(); });

  const update = () => {
    // Move obstacles down (toward player)
    obstacles.forEach(ob => (ob.y += speed));
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].y > canvas.height) obstacles.shift();
    // Spawn new obstacles periodically
    if (frameCount % spawnInterval === 0) createObstacle();
    frameCount++;
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw tunnel centre line (optional visual aid)
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    // Draw player dot
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw obstacles
    ctx.fillStyle = '#0066ff';
    obstacles.forEach(ob => {
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    });
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Start the game loop
  requestAnimationFrame(loop);
})();
