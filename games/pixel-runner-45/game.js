// Pixel Runner – minimal endless runner
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Set canvas size – can be overridden by CSS
  canvas.width = 800;
  canvas.height = 200;
  // Load sound effects (using data URIs)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');

  // Game state
  const player = { x: 50, y: 0, w: 30, h: 30, vy: 0, onGround: false };
  const gravity = 0.8;
  const jumpStrength = -15;
  let speed = 3; // obstacle speed (pixels per frame)
  const groundHeight = 20; // ground thickness
  const obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames between spawns
  let frame = 0;
  let running = true;

  // Input – space or click to jump
  const jump = () => {
    if (player.onGround) {
      player.vy = jumpStrength;
      player.onGround = false;
      // Play jump sound
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  };
  document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('mousedown', jump);

  const rectIntersect = (a, b) => (
    a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y
  );

  const reset = () => {
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    speed = 3;
    frame = 0;
    running = true;
    requestAnimationFrame(loop);
  };

  const loop = () => {
    if (!running) return;
    frame++;
    // Clear and background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#87CEEB');
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Ground
    // (groundHeight defined globally)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= canvas.height - groundHeight) {
      player.y = canvas.height - groundHeight - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw player (rounded rect with gradient)
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#5dade2');
    playerGrad.addColorStop(1, '#2980b9');
    ctx.fillStyle = playerGrad;
    const radius = 5;
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

    // Spawn obstacles
    spawnTimer++;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      const height = 20 + Math.random() * 40;
      obstacles.push({ x: canvas.width, y: canvas.height - groundHeight - height, w: 20, h: height });
    }

    // Update and draw obstacles with gradient and rounded corners
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;
      // Gradient for obstacle
      const grad = ctx.createLinearGradient(0, obs.y, 0, obs.y + obs.h);
      grad.addColorStop(0, '#c0392b');
      grad.addColorStop(1, '#e74c3c');
      ctx.fillStyle = grad;
      const radius = 3;
      ctx.beginPath();
      ctx.moveTo(obs.x + radius, obs.y);
      ctx.lineTo(obs.x + obs.w - radius, obs.y);
      ctx.quadraticCurveTo(obs.x + obs.w, obs.y, obs.x + obs.w, obs.y + radius);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h - radius);
      ctx.quadraticCurveTo(obs.x + obs.w, obs.y + obs.h, obs.x + obs.w - radius, obs.y + obs.h);
      ctx.lineTo(obs.x + radius, obs.y + obs.h);
      ctx.quadraticCurveTo(obs.x, obs.y + obs.h, obs.x, obs.y + obs.h - radius);
      ctx.lineTo(obs.x, obs.y + radius);
      ctx.quadraticCurveTo(obs.x, obs.y, obs.x + radius, obs.y);
      ctx.closePath();
      ctx.fill();
      // Collision
      if (rectIntersect(player, obs)) {
        // Play crash sound
        crashSound.currentTime = 0;
        crashSound.play();
        running = false;
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#000';
        ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
        // Restart after short delay
        setTimeout(reset, 2000);
        return;
      }
      // Remove off‑screen obstacles
      if (obs.x + obs.w < 0) obstacles.splice(i, 1);
    }

    // Gradually increase speed
    if (frame % 300 === 0) speed += 0.3;

    requestAnimationFrame(loop);
  };

  // Initialize player on ground
  player.y = canvas.height - player.h;
  player.onGround = true;
  requestAnimationFrame(loop);
})();
