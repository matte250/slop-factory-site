// Meteor Dodge game implementation
// Targets canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Set canvas size (fallback if not set via HTML/CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Generate simple star field for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  // Game settings
  const shipWidth = 60;
  const shipHeight = 20;
  const shipSpeed = 6;
  const meteorRadius = 20;
  const meteorMinSpeed = 2;
  const meteorMaxSpeed = 5;
  const spawnInterval = 1500; // ms

  let shipX = (canvas.width - shipWidth) / 2;
  const shipY = canvas.height - shipHeight - 10;

  let leftPressed = false;
  let rightPressed = false;

  const meteors = [];
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;
  let startTime = performance.now();

  // Sound effects (using data URI placeholders)
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // simple beep
  const spawnSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  crashSound.volume = 0.5;
  spawnSound.volume = 0.3;

  // Input handling
  const keyDownHandler = e => {
    if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = true;
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = true;
  };
  const keyUpHandler = e => {
    if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = false;
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = false;
  };
  window.addEventListener('keydown', keyDownHandler);
  window.addEventListener('keyup', keyUpHandler);

  // Mouse/touch support (optional)
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    shipX = Math.min(canvas.width - shipWidth, Math.max(0, mouseX - shipWidth / 2));
  });

  function spawnMeteor() {
    const x = Math.random() * (canvas.width - meteorRadius * 2) + meteorRadius;
    const speed = Math.random() * (meteorMaxSpeed - meteorMinSpeed) + meteorMinSpeed;
    meteors.push({ x, y: -meteorRadius, radius: meteorRadius, speed });
    // Play spawn sound
    spawnSound.currentTime = 0;
    spawnSound.play();
  }

  function update(delta) {
    if (gameOver) return;
    // Move ship
    if (leftPressed) shipX = Math.max(0, shipX - shipSpeed);
    if (rightPressed) shipX = Math.min(canvas.width - shipWidth, shipX + shipSpeed);

    // Spawn meteors
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off-screen meteors
      if (m.y - m.radius > canvas.height) {
        meteors.splice(i, 1);
        continue;
      }
      // Collision with ship (simple AABB vs circle)
      const shipRect = { x: shipX, y: shipY, w: shipWidth, h: shipHeight };
      const distX = Math.abs(m.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(m.y - (shipRect.y + shipRect.h / 2));
      if (distX > (shipRect.w / 2 + m.radius) || distY > (shipRect.h / 2 + m.radius)) {
        continue; // no collision
      }
      // Collision detected
      crashSound.currentTime = 0;
      crashSound.play();
      gameOver = true;
    }

    // Update score based on elapsed time
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Clear with night sky gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship as a triangle with gradient
    const shipGrad = ctx.createLinearGradient(shipX, shipY, shipX, shipY + shipHeight);
    shipGrad.addColorStop(0, '#00aaff');
    shipGrad.addColorStop(1, '#0044aa');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(shipX, shipY + shipHeight);
    ctx.lineTo(shipX + shipWidth / 2, shipY);
    ctx.lineTo(shipX + shipWidth, shipY + shipHeight);
    ctx.closePath();
    ctx.fill();

    // Draw meteors
    ctx.fillStyle = '#aa0000';
    meteors.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
