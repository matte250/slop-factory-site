// Simple Astro Dodge game with improved graphics
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Load sounds (replace src with actual files)
  const collisionSound = new Audio('collision.mp3');
  const moveSound = new Audio('move.wav');

  // Player ship
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Asteroids
  const asteroids = [];
  // Stars for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  let spawnTimer = 0;
  const spawnInterval = 90; // frames

  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    if (gameOver) return;
    // Move ship with sound
    if (keys.ArrowLeft) {
      ship.x -= ship.speed;
      moveSound.currentTime = 0;
      moveSound.play();
    }
    if (keys.ArrowRight) {
      ship.x += ship.speed;
      moveSound.currentTime = 0;
      moveSound.play();
    }
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    if (spawnTimer <= 0) {
      const size = 20 + Math.random() * 30;
      asteroids.push({ x: Math.random() * (width - size), y: -size, size, speed: 2 + Math.random() * 3 });
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship
      if (
        a.x < ship.x + ship.w &&
        a.x + a.size > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.size > ship.y
      ) {
        if (!gameOver) {
          collisionSound.currentTime = 0;
          collisionSound.play();
        }
        gameOver = true;
      }
      // Remove if off screen
      if (a.y > height) {
        asteroids.splice(i, 1);
        // lose condition if asteroid reaches bottom (optional extra)
        gameOver = true;
      }
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship as triangle
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, 'lightgray');
      grad.addColorStop(1, 'darkgray');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
