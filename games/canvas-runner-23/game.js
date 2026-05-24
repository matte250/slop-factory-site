// game.js – simple endless runner using canvas with id "game"

(() => {
  // Get canvas and context
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Canvas size (use CSS size or set defaults)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 200;
  // Define visual constants
  const SKY_TOP = '#87ceeb';
  const SKY_BOTTOM = '#b0e0e6';
  const GROUND_HEIGHT = 20;
  const GROUND_COLOR = '#654321';
  const PLAYER_COLOR = '#ff0';
  const PLAYER_SHADOW = 'rgba(0,0,0,0.3)';
  const OBSTACLE_COLOR = '#c00';
  const OBSTACLE_RADIUS = 5;
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Play a simple beep
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000);
  };
  const playJumpSound = () => playBeep(440, 100);
  const playCollisionSound = () => playBeep(100, 300);


  // Game settings
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 30;
  const GROUND_Y = canvas.height - GROUND_HEIGHT - PLAYER_SIZE;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 1500; // ms between obstacles
  const OBSTACLE_SPEED = 4;

  // Player state
  const player = {
    x: 50,
    y: GROUND_Y,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
  };

  // Obstacles array
  const obstacles = [];
  let lastObstacleTime = 0;
  let gameOver = false;

  // Input handling – space bar or mouse click
  const jump = () => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround && !gameOver) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      playJumpSound();
    }
  };
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') jump();
  });
  canvas.addEventListener('click', jump);

  // Collision detection
  const hitTest = (a, b) => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  // Main loop
  const update = (timestamp) => {
    if (gameOver) {
      // Show Game Over text
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height - GROUND_HEIGHT);
    skyGrad.addColorStop(0, SKY_TOP);
    skyGrad.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);

    // Draw ground
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Update player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw player with shadow and rounded corners
    // Shadow
    ctx.fillStyle = PLAYER_SHADOW;
    ctx.fillRect(player.x + 5, player.y + 5, player.width, player.height);
    // Player
    ctx.fillStyle = PLAYER_COLOR;
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.width - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + radius);
    ctx.lineTo(player.x + player.width, player.y + player.height - radius);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height);
    ctx.lineTo(player.x + radius, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // Spawn obstacles
    if (timestamp - lastObstacleTime > OBSTACLE_GAP) {
      obstacles.push({
        x: canvas.width,
        y: GROUND_Y,
        width: OBSTACLE_WIDTH,
        height: PLAYER_SIZE,
      });
      lastObstacleTime = timestamp;
    }

    // Update and draw obstacles with rounded corners
    ctx.fillStyle = OBSTACLE_COLOR;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // Rounded rectangle drawing
      const r = OBSTACLE_RADIUS;
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.width - r, o.y);
      ctx.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + r);
      ctx.lineTo(o.x + o.width, o.y + o.height - r);
      ctx.quadraticCurveTo(o.x + o.width, o.y + o.height, o.x + o.width - r, o.y + o.height);
      ctx.lineTo(o.x + r, o.y + o.height);
      ctx.quadraticCurveTo(o.x, o.y + o.height, o.x, o.y + o.height - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.closePath();
      ctx.fill();

      // Collision
      if (hitTest(player, o)) {
        playCollisionSound();
        gameOver = true;
      }

      // Remove off‑screen obstacles
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
})();
