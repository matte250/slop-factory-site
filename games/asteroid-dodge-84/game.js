// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size if not set
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const shipWidth = 50;
  const shipHeight = 20;
  const ship = { x: canvas.width / 2 - shipWidth / 2, y: canvas.height - shipHeight - 10, speed: 5 };
  const keys = { left: false, right: false };

  const asteroids = [];
  // Sound effects
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const scoreSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
  }
  let asteroidTimer = 0;
  const asteroidInterval = 60; // frames
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size);
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, size, speed });
  }

  function update() {
  if (gameOver) return;
  // Move ship
  if (keys.left) ship.x -= ship.speed;
  if (keys.right) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - shipWidth, ship.x));
  // Move background stars
  for (let s of stars) {
    s.y += 0.5;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  }
  // Spawn asteroids
  if (asteroidTimer <= 0) {
    spawnAsteroid();
    asteroidTimer = asteroidInterval;
  } else {
    asteroidTimer--;
  }
  // Update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    // Check collision with ship
    if (
      a.x < ship.x + shipWidth &&
      a.x + a.size > ship.x &&
      a.y < ship.y + shipHeight &&
      a.y + a.size > ship.y
    ) {
      // Play crash sound
      crashSound.currentTime = 0;
      crashSound.play();
      gameOver = true;
      break;
    }
    // Remove and increase score if passed bottom
    if (a.y > canvas.height) {
      asteroids.splice(i, 1);
      score++;
      // Play score increment sound
      scoreSound.currentTime = 0;
      scoreSound.play();
    }
  }
}



  function draw() {
    // Gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, 1, 1));
    // Draw ship as a triangle with outline
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + shipWidth / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + shipHeight);
    ctx.lineTo(ship.x + shipWidth, ship.y + shipHeight);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#060';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Draw asteroids with radial gradient for glow
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
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

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Start game
  requestAnimationFrame(loop);
})();
