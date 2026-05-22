// Canvas Runner Game
// Implements a simple endless runner using the <canvas id="game"></canvas> element.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size – you can adjust as needed.
  canvas.width = 800;
  canvas.height = 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const OBSTACLE_WIDTH = 20;
  const MIN_OBSTACLE_HEIGHT = 30;
  const MAX_OBSTACLE_HEIGHT = 80;
  const OBSTACLE_GAP = 150; // distance between obstacles
  const BASE_SPEED = 4;
  const SPEED_INCREMENT = 0.001; // per frame

  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Player state
  const player = {
    x: 50,
    y: canvas.height - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
  };

  // Obstacle list
  const obstacles = [];
  let nextObstacleX = canvas.width + 200; // initial spawn position

  // Cloud list for parallax background
  const clouds = [];
  // Initialize a few clouds
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: 20 + Math.random() * 60,
      r: 15 + Math.random() * 10,
      speed: 0.5 + Math.random() * 0.5,
    });
  }

  let speed = BASE_SPEED;
  let score = 0;
  let gameOver = false;

  // Input handling – space or mouse click / tap
  const handleJump = () => {
    // Ensure AudioContext is running (required after user interaction)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (player.onGround && !gameOver) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      // play jump sound
      playBeep(440, 0.1);
    }
  };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') handleJump();
  });
  canvas.addEventListener('click', handleJump);

  // Create a new obstacle
  function addObstacle() {
    const height = MIN_OBSTACLE_HEIGHT + Math.random() * (MAX_OBSTACLE_HEIGHT - MIN_OBSTACLE_HEIGHT);
    obstacles.push({
      x: nextObstacleX,
      y: canvas.height - height,
      width: OBSTACLE_WIDTH,
      height,
    });
    nextObstacleX += OBSTACLE_GAP + Math.random() * 100; // vary spacing
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
    if (gameOver) return;

    // Move player
    player.vy += GRAVITY;
    player.y += player.vy;
    // Ground check
    if (player.y + player.height >= canvas.height) {
      player.y = canvas.height - player.height;
      player.vy = 0;
      player.onGround = true;
    }

    // Move clouds (parallax, slower than obstacles)
    clouds.forEach((c) => {
      c.x -= c.speed;
      if (c.x + c.r * 2 < 0) {
        c.x = canvas.width + c.r;
        c.y = 20 + Math.random() * 60;
      }
    });

    // Move obstacles leftward
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;
      // Remove off-screen obstacles and increase score
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
        score++;
      } else if (collides(player, obs)) {
        // play collision sound
        playBeep(150, 0.3);
        gameOver = true;
      }
    }

    // Spawn new obstacles as needed
    if (nextObstacleX - canvas.width < 0) {
      addObstacle();
    }

    // Ramp up speed gradually
    speed += SPEED_INCREMENT;

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background (gradient sky and ground)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87CEEB'); // sky top
    skyGrad.addColorStop(1, '#fff'); // horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax clouds (slow moving)
    clouds.forEach((c) => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.arc(c.x - c.r * 0.6, c.y + c.r * 0.2, c.r * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x + c.r * 0.6, c.y + c.r * 0.2, c.r * 0.8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    });

    // Ground strip
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Draw player (rounded avatar)
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    // simple eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x + player.width * 0.6, player.y + player.height * 0.4, player.width * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles (vary color)
    obstacles.forEach((obs) => {
      ctx.fillStyle = '#424242';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      // optional top spike
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y);
      ctx.lineTo(obs.x + obs.width / 2, obs.y - 10);
      ctx.lineTo(obs.x + obs.width, obs.y);
      ctx.closePath();
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  // Start the game loop
  addObstacle();
  update();
})();
