// Pixel Navigator – simple endless runner
// Canvas with id "game" must exist in the HTML.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Simple tone player
  function playTone(freq, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context resumes on first interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  window.addEventListener('keydown', resumeAudio);
  
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Set canvas size to fill the window (adjustable later)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.6; // 60% height for play area
  };
  window.addEventListener('resize', resize);
  resize();

  // Game constants
  const PLAYER_SIZE = 40;
  const GRAVITY = 0.8;
  const JUMP_VELOCITY = -15;
  const DASH_SPEED = 8; // extra forward speed while dashing
  const BASE_SPEED = 4; // forward speed of the world
  const OBSTACLE_FREQ = 1500; // ms between obstacles
  const OBSTACLE_MIN_W = 20;
  const OBSTACLE_MAX_W = 60;
  const OBSTACLE_MIN_H = 40;
  const OBSTACLE_MAX_H = 120;

  // Player state
  const player = {
    x: canvas.width * 0.2,
    y: canvas.height - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
    dash: false,
  };

  // Obstacles array
  const obstacles = [];

  // Score tracking
  let score = 0;
  let lastObstacleTime = 0;
  let lastFrame = performance.now();
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Play jump sound
    if (e.code === 'Space' && player.onGround) {
      playTone(400);
    }
    // Play dash sound when dash starts
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !player.dash) {
      playTone(200);
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  function spawnObstacle() {
    const w = OBSTACLE_MIN_W + Math.random() * (OBSTACLE_MAX_W - OBSTACLE_MIN_W);
    const h = OBSTACLE_MIN_H + Math.random() * (OBSTACLE_MAX_H - OBSTACLE_MIN_H);
    obstacles.push({
      x: canvas.width,
      y: canvas.height - h,
      width: w,
      height: h,
    });
  }

  function update(dt) {
    // Player controls
    if (keys['Space'] && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
    }
    player.dash = keys['ShiftLeft'] || keys['ShiftRight'];

    // Apply gravity
    player.vy += GRAVITY;
    player.y += player.vy;
    // Ground collision
    if (player.y + player.height >= canvas.height) {
      player.y = canvas.height - player.height;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles leftwards
    const speed = BASE_SPEED + (player.dash ? DASH_SPEED : 0);
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      // Remove off‑screen obstacles
if (ob.x + ob.width < 0) {
          obstacles.splice(i, 1);
          score++;
          // Play score tone
          playTone(600, 0.05);
        }
    }

    // Spawn new obstacles
    if (performance.now() - lastObstacleTime > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacleTime = performance.now();
    }

    // Collision detection (AABB)
    for (const ob of obstacles) {
      if (
        player.x < ob.x + ob.width &&
        player.x + player.width > ob.x &&
        player.y < ob.y + ob.height &&
        player.y + player.height > ob.y
      ) {
        // Play collision sound
        playTone(150, 0.3);
        running = false; // lose condition
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#ffffff'); // horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground strip
    const groundY = canvas.height - 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, canvas.width, 20);

    // Helper for rounded rectangles
    const drawRounded = (x, y, w, h, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };

    // Draw player with rounded corners
    drawRounded(player.x, player.y, player.width, player.height, 8, '#0a84ff');

    // Draw obstacles with rounded corners and gradient
    const obsGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    obsGrad.addColorStop(0, '#ff7f7f');
    obsGrad.addColorStop(1, '#c40000');
    for (const ob of obstacles) {
      drawRounded(ob.x, ob.y, ob.width, ob.height, 6, obsGrad);
    }

    // Draw score on top
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`,
      10,
      30);
  }

  function loop(timestamp) {
    const dt = timestamp - lastFrame;
    lastFrame = timestamp;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  requestAnimationFrame(loop);
})();
