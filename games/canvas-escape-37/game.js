// Simple endless runner with enhanced graphics
// Canvas element with id "game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 200;

  // Game constants
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 10;
  const SCROLL_SPEED = 3;
  const OBSTACLE_WIDTH = 15;
  const GAP_WIDTH = 30;
  const SPAWN_INTERVAL = 120; // frames

  let frameCount = 0;
  let obstacles = [];
  let gameOver = false;

  const player = {
    x: 50,
    y: canvas.height - PLAYER_SIZE,
    vy: 0,
    onGround: true,
    draw() {
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(this.x, canvas.height - PLAYER_SIZE / 2, PLAYER_SIZE * 0.6, PLAYER_SIZE * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      // radial gradient for a shining dot
      const grad = ctx.createRadialGradient(this.x, this.y, PLAYER_SIZE * 0.1, this.x, this.y, PLAYER_SIZE / 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#0d6efd');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      // Ground collision
      if (this.y > canvas.height - PLAYER_SIZE) {
        this.y = canvas.height - PLAYER_SIZE;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
  };

  function spawnObstacle() {
    // Randomly decide between spike (solid) and gap (empty space)
    const isGap = Math.random() < 0.3; // 30% gaps
    const width = isGap ? GAP_WIDTH : OBSTACLE_WIDTH;
    const height = isGap ? 0 : canvas.height - Math.random() * 50; // spikes from bottom up
    obstacles.push({ x: canvas.width, width, height, isGap });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      // Remove off‑screen
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (o.isGap) continue; // No collision with gaps
      // Simple AABB collision with the player circle approximated as box
      const playerBox = {
        left: player.x - PLAYER_SIZE / 2,
        right: player.x + PLAYER_SIZE / 2,
        top: player.y - PLAYER_SIZE / 2,
        bottom: player.y + PLAYER_SIZE / 2,
      };
      const obstacleBox = {
        left: o.x,
        right: o.x + o.width,
        top: canvas.height - o.height,
        bottom: canvas.height,
      };
      if (
        playerBox.right > obstacleBox.left &&
        playerBox.left < obstacleBox.right &&
        playerBox.bottom > obstacleBox.top &&
        playerBox.top < obstacleBox.bottom
      ) {
        gameOver = true;
        playSound(100, 'sawtooth', 0.3); // collision sound
        break;
      }
    }
  }

  function drawObstacles() {
    ctx.fillStyle = '#dc3545';
    for (const o of obstacles) {
      if (o.isGap) continue;
      // draw spike as triangle
      ctx.beginPath();
      ctx.moveTo(o.x, canvas.height);
      ctx.lineTo(o.x + o.width / 2, canvas.height - o.height);
      ctx.lineTo(o.x + o.width, canvas.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Cloud handling for background parallax
  const clouds = [];
  const CLOUD_SPAWN_INTERVAL = 180; // frames
  function spawnCloud() {
    const cloud = {
      x: canvas.width,
      y: Math.random() * (canvas.height * 0.5), // upper half
      radius: 20 + Math.random() * 15,
      speed: SCROLL_SPEED * 0.5,
    };
    clouds.push(cloud);
  }
  function updateClouds() {
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.radius < 0) clouds.splice(i, 1);
    }
    if (frameCount % CLOUD_SPAWN_INTERVAL === 0) spawnCloud();
  }
  function drawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function gameLoop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky
    bgGrad.addColorStop(1, '#fff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 1);
    ctx.lineTo(canvas.width, canvas.height - 1);
    ctx.stroke();

    // Update background elements
    updateClouds();
    // Spawn obstacles periodically
    if (frameCount % SPAWN_INTERVAL === 0) spawnObstacle();

    updateObstacles();
    player.update();
    checkCollision();

    // Draw background elements
    drawClouds();
    drawObstacles();
    player.draw();

    frameCount++;
    requestAnimationFrame(gameLoop);
  }

  // Input handling – click or tap to jump
  canvas.addEventListener('click', () => {
    if (player.onGround && !gameOver) {
      player.vy = JUMP_VELOCITY;
      playSound(300, 'square', 0.08); // jump sound
    }
  });
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player.onGround && !gameOver) player.vy = JUMP_VELOCITY;
  }, { passive: false });

  // Start the loop
  requestAnimationFrame(gameLoop);
})();
