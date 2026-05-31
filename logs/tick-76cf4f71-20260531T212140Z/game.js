// Pixel Runner – simple endless runner for a canvas with id "game"
// The script creates a side‑scrolling runner that jumps on click/tap.

(function () {
  // Get canvas and context
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Load sounds (using placeholder URLs)
  const jumpSound = new Audio('https://actions.googleusercontent.com/actions/media/largest_id/1581833630'); // placeholder jump sound
  const gameOverSound = new Audio('https://actions.googleusercontent.com/actions/media/largest_id/1581833631'); // placeholder game over sound

  // Set fixed size (can be changed later)
  canvas.width = 800;
  canvas.height = 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // min distance between obstacles
  const SPEED_START = 3;
  const SPEED_INCREMENT = 0.001; // per frame

  // State
  let speed = SPEED_START;
  let score = 0;
  let frameCount = 0;
  const player = {
    x: 50,
    y: canvas.height - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
  };
  const obstacles = [];
  const clouds = []; // background clouds

  // Input – jump on any click/tap
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', jump);
function jump(e) {
    e.preventDefault();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      // Play jump sound
      if (jumpSound) {
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
    }
  }
  }

  // Helper – spawn new obstacle
  function spawnObstacle() {


  // Helper – spawn background cloud
  function spawnCloud() {
    const radius = Math.random() * 20 + 15;
    const y = Math.random() * (canvas.height * 0.4);
    clouds.push({
      x: canvas.width,
      y: y,
      radius: radius,
      speedFactor: Math.random() * 0.5 + 0.2, // slower than obstacles
    });
  }


  // Collision detection (AABB)
  function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  // Main loop
  function update() {
    // Clear and draw background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#87CEEB'); // sky
    bgGradient.addColorStop(1, '#fff');   // horizon
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 5, canvas.width, 5);

    // Update player physics
    // Draw clouds (parallax background)
    // spawn clouds occasionally
    if (frameCount % 200 === 0) {
        spawnCloud();
    }
    // update and draw clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = clouds.length - 1; i >= 0; i--) {
        const c = clouds[i];
        c.x -= speed * c.speedFactor;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        if (c.x + c.radius < 0) {
            clouds.splice(i, 1);
        }
    }

    // Update player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.height >= canvas.height) {
      player.y = canvas.height - player.height;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw player – orange circle with shadow
    ctx.save();
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width/2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Spawn obstacles periodically
    if (frameCount % Math.round(120 / speed) === 0) {
      // Ensure enough gap from last obstacle
      if (obstacles.length === 0 || canvas.width - obstacles[obstacles.length - 1].x > OBSTACLE_GAP) {
        spawnObstacle();
      }
    }

    // Update and draw obstacles
    ctx.fillStyle = '#333';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      // Collision check
      if (collides(player, obs)) {
        // Game over – stop animation and show score
      cancelAnimationFrame(animationId);
      // Play game over sound
      if (gameOverSound) {
        gameOverSound.currentTime = 0;
        gameOverSound.play();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + Math.floor(score), canvas.width / 2, canvas.height / 2 + 20);
      return;
      }

      // Remove off‑screen obstacles
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
      }
    }

    // Update speed and score
    speed += SPEED_INCREMENT;
    score += speed;

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    frameCount++;
    animationId = requestAnimationFrame(update);
  }

  let animationId = requestAnimationFrame(update);
})();
