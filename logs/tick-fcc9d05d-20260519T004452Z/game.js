// game.js – Simple "Pixel Runner" endless runner
// Targets <canvas id="game"></canvas> present in the HTML.

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Set canvas size to match its displayed size
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Game constants
  const CLOUD_COUNT = 5;
  const CLOUD_SPEED = 0.5;
  const CLOUD_MIN_Y = 20;
  const CLOUD_MAX_Y = 80;
  const CLOUD_WIDTH = 50;
  const CLOUD_HEIGHT = 30;
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_MIN_HEIGHT = 20;
  const OBSTACLE_MAX_HEIGHT = 60;
  const OBSTACLE_GAP = 200; // distance between spawns
  const SPEED = 3; // pixels per frame (background scroll)

  // Player state
  const player = {
    x: 50,
    y: 0,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: false,
  };

  // Obstacles array
  const obstacles = [];
  let lastObstacleX = canvas.width;

  // Cloud objects
  const clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: CLOUD_MIN_Y + Math.random() * (CLOUD_MAX_Y - CLOUD_MIN_Y),
      width: CLOUD_WIDTH,
      height: CLOUD_HEIGHT,
    });
  }

  // Score (distance travelled)
  let score = 0;
  let startTime = null;
  let gameOver = false;

  // Input handling – space or up arrow to jump
  function handleJump(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (player.onGround) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
        playTone(440, 0.1); // jump sound
      }
    }
  }
  window.addEventListener('keydown', handleJump);

  // Helper: collision detection (AABB)
  function collides(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Spawn a new obstacle
  function addObstacle() {
    const height = OBSTACLE_MIN_HEIGHT + Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height,
      width: OBSTACLE_WIDTH,
      height,
    });
  }

  // Main game loop
  // Added background scroll offset for simple parallax
  let bgOffset = 0;
  // Cloud objects
  const clouds = [];
  // Initialize clouds once
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: CLOUD_MIN_Y + Math.random() * (CLOUD_MAX_Y - CLOUD_MIN_Y),
      width: CLOUD_WIDTH,
      height: CLOUD_HEIGHT,
    });
  }
  function update(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (startTime + score * 16.6667);
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#b0e0e6'); // pale turquoise
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw moving clouds
    for (let c of clouds) {
      c.x -= CLOUD_SPEED;
      if (c.x + c.width < 0) c.x = canvas.width;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(c.x + c.width / 2, c.y, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Simple parallax ground pattern
    bgOffset = (bgOffset + SPEED / 2) % canvas.width;
    ctx.fillStyle = '#654321'; // brown ground
    ctx.fillRect(0, canvas.height - 2, canvas.width, 2);
    // draw repeating rectangles as hills
    for (let i = -canvas.width; i < canvas.width * 2; i += 40) {
      ctx.fillStyle = '#556b2f';
      ctx.fillRect(i + bgOffset, canvas.height - 30, 30, 20);
    }

    // Update player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    const groundY = canvas.height - player.height;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw player as a simple pixel character
    ctx.fillStyle = '#0f0';
    // Body
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Head (smaller square on top)
    ctx.fillStyle = '#0a0';
    ctx.fillRect(player.x + 4, player.y - 8, 12, 8);
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 6, player.y - 6, 2, 2);
    ctx.fillRect(player.x + 12, player.y - 6, 2, 2);

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= SPEED;
      // Draw obstacle with simple 3‑D effect
      const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
      grad.addColorStop(0, '#ff7f7f'); // lighter top
      grad.addColorStop(1, '#b22222'); // darker bottom
      ctx.fillStyle = grad;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      // optional top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(obs.x, obs.y, obs.width, 2);


      // Collision check
      if (collides(player, obs)) {
        playTone(150, 0.3); // collision sound
        gameOver = true;
      }

      // Remove off‑screen obstacles
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
      }
    }

    // Spawn obstacles based on distance travelled
    if (lastObstacleX - player.x > OBSTACLE_GAP) {
      addObstacle();
      lastObstacleX = canvas.width;
    } else {
      lastObstacleX -= SPEED;
    }

    // Update score (distance travelled)
    score = Math.floor((timestamp - startTime) / 10);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (!gameOver) {
      requestAnimationFrame(update);
    } else {
      // Game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  // Start the loop
  requestAnimationFrame(update);
})();
