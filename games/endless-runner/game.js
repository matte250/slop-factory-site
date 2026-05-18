// Simple side‑scrolling endless runner
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Sound assets (tiny data URIs)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YYQAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg');
  const coinSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YYQAAACAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YYQAAACAgP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAA');
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YYQAAACAgP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AAP8AA');

  // Game constants
  const GRAVITY = 0.6;
  const CLOUD_SPACING = 400;
  const CLOUD_SPEED_FACTOR = 0.5; // slower than ground
  const CLOUD_RADIUS = 30;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_HEIGHT = 40;
  const COIN_RADIUS = 8;
  const OBSTACLE_SPACING = 300; // distance between obstacles
  const COIN_SPACING = 200; // distance between coins
  const SCROLL_SPEED = 4;
  const MAX_COLLISIONS = 3;

  // Game state
  let playerY = height - PLAYER_SIZE;
  let playerVy = 0;
  let isGrounded = true;
  let offsetX = 0; // world offset for scrolling
  let obstacles = [];
  let coins = [];
  let clouds = [];
  let score = 0;
  let collisions = 0;
  let gameOver = false;

  // Input handling – tap/click makes the player jump if grounded
  canvas.addEventListener('click', () => {
    if (isGrounded && !gameOver) {
      playerVy = JUMP_VELOCITY;
      isGrounded = false;
      // Play jump sound
      jumpSound.currentTime = 0;
      jumpSound.play().catch(() => {});
    }
  });

  // Helper: generate obstacles and coins ahead of the player
  function generateWorld() {
    // Ensure enough obstacles are queued
    const lastObstacleX = obstacles.length ? obstacles[obstacles.length - 1].x : 0;
    if (lastObstacleX - offsetX < width + OBSTACLE_SPACING) {
      const gap = Math.random() * 200 + 100; // random gap between obstacles
      const x = lastObstacleX + OBSTACLE_SPACING + gap;
      const y = height - OBSTACLE_HEIGHT;
      obstacles.push({ x, y, w: OBSTACLE_WIDTH, h: OBSTACLE_HEIGHT });
    }
    // Ensure enough coins are queued
    const lastCoinX = coins.length ? coins[coins.length - 1].x : 0;
    if (lastCoinX - offsetX < width + COIN_SPACING) {
      const gap = Math.random() * 150 + 50;
      const x = lastCoinX + COIN_SPACING + gap;
      const y = height - PLAYER_SIZE - Math.random() * 80 - 40; // float above ground
      coins.push({ x, y, r: COIN_RADIUS, collected: false });
    }
    // Ensure enough clouds are queued
    const lastCloudX = clouds.length ? clouds[clouds.length - 1].x : 0;
    if (lastCloudX - offsetX < width + CLOUD_SPACING) {
      const gap = Math.random() * 200 + 100;
      const x = lastCloudX + CLOUD_SPACING + gap;
      const y = Math.random() * (height * 0.3); // upper half of canvas
      clouds.push({ x, y, r: CLOUD_RADIUS });
    }
  }

  // Collision detection helpers
  function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    // Find the closest point to the circle within the rectangle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  function update() {
    if (gameOver) return;

    // Player physics
    playerVy += GRAVITY;
    playerY += playerVy;
    if (playerY >= height - PLAYER_SIZE) {
      playerY = height - PLAYER_SIZE;
      playerVy = 0;
      isGrounded = true;
    }

    // Scroll world
    offsetX += SCROLL_SPEED;

    // Move obstacles, coins, and clouds leftward (clouds slower)
    obstacles.forEach(ob => { ob.x -= SCROLL_SPEED; });
    coins.forEach(c => { c.x -= SCROLL_SPEED; });
    clouds.forEach(cl => { cl.x -= SCROLL_SPEED * CLOUD_SPEED_FACTOR; });

    // Remove off‑screen objects
    obstacles = obstacles.filter(ob => ob.x + ob.w > 0);
    coins = coins.filter(c => c.x + c.r > 0);
    clouds = clouds.filter(cl => cl.x + cl.r > 0);

    // Generate more world elements as needed
    generateWorld();

    // Collision with obstacles
    obstacles.forEach(ob => {
      if (rectIntersect(50, playerY, PLAYER_SIZE, PLAYER_SIZE, ob.x, ob.y, ob.w, ob.h)) {
        collisions++;
        // Play hit sound
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {});
        // Simple response: push player back a bit
        playerY = ob.y - PLAYER_SIZE;
        playerVy = 0;
        isGrounded = false;
      }
    });

    // Collision with coins
    coins.forEach(c => {
      if (!c.collected && circleRect(50 + PLAYER_SIZE / 2, playerY + PLAYER_SIZE / 2, c.r, c.x, c.y, c.r * 2, c.r * 2)) {
        c.collected = true;
        score += 10;
        // Play coin sound
        coinSound.currentTime = 0;
        coinSound.play().catch(() => {});
      }
    });

    // End condition
    if (collisions >= MAX_COLLISIONS) {
      gameOver = true;
      // Play game over sound
      gameOverSound.currentTime = 0;
      gameOverSound.play().catch(() => {});
    }
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, width, height);

// Draw sky gradient background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#87ceeb'); // light sky
  skyGrad.addColorStop(1, '#b0e0e6'); // pale blue
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw moving clouds (parallax)
  clouds.forEach(cl => {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
    ctx.arc(cl.x + cl.r, cl.y - cl.r * 0.6, cl.r * 0.8, 0, Math.PI * 2);
    ctx.arc(cl.x - cl.r, cl.y - cl.r * 0.6, cl.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw ground with simple texture
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, height - 5, width, 5);

    // Draw player (simple square)
    ctx.fillStyle = '#00f';
    ctx.fillRect(50, playerY, PLAYER_SIZE, PLAYER_SIZE);

    // Draw obstacles (red rectangles)
    ctx.fillStyle = '#f00';
    obstacles.forEach(ob => {
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    });

    // Draw coins (gold circles)
    ctx.fillStyle = '#ff0';
    coins.forEach(c => {
      if (!c.collected) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // UI: score & collisions
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Hits: ${collisions}/${MAX_COLLISIONS}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Final Score: ${score}`,
        width / 2,
        height / 2 + 10);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  generateWorld();
  requestAnimationFrame(loop);
})();
