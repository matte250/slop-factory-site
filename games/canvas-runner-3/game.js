// Simple endless runner with enhanced graphics for canvas id "game"
window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to its CSS dimensions or fallback
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;

  // ----- Game objects -----
  const player = {x: 50, y: H - 30, w: 20, h: 30, vy: 0, onGround: true};
  const GRAVITY = 0.8, JUMP = -15;

  const obstacles = [];
  const OBSTACLE_W = 20;
  const spawnTimer = {value: 0};
  const spawnInterval = 90;

  // Clouds for background parallax
  const clouds = [];
  const CLOUD_SPEED = 0.5;

  let score = 0;
  let gameOver = false;

  // ----- Helper functions -----
  const drawBackground = () => {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#4682b4'); // deep sky blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // Moving clouds
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 20, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(c.x + 25, c.y - 20, 30, Math.PI * 1, Math.PI * 2);
      ctx.arc(c.x + 55, c.y, 20, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();
    });
    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - 10, W, 10);
  };

  const drawPlayer = () => {
    // Body
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Head
    ctx.fillStyle = '#ffdd99';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y - 8, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawObstacles = () => {
    ctx.fillStyle = '#8b0000'; // dark red
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
  };

  const updateClouds = () => {
    // Add new cloud occasionally
    if (clouds.length < 5 && Math.random() < 0.01) {
      clouds.push({x: W + Math.random() * 100, y: 30 + Math.random() * 40});
    }
    // Move clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= CLOUD_SPEED;
      if (c.x < -80) clouds.splice(i, 1);
    }
  };

  const loop = () => {
    if (gameOver) return;
    // ----- Update game state -----
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= H - player.h) { player.y = H - player.h; player.vy = 0; player.onGround = true; }
    else player.onGround = false;

    // Obstacles
    spawnTimer.value++;
    if (spawnTimer.value >= spawnInterval) {
      // Randomize obstacle height for variety
      const height = OBSTACLE_W + Math.random() * 40;
      obstacles.push({x: W, y: H - 10 - height, w: OBSTACLE_W, h: height});
      spawnTimer.value = 0;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision detection
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        triggerGameOver();
      }
    }

    // Clouds
    updateClouds();

    score++;

    // ----- Render -----
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawObstacles();
    drawPlayer();
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 10), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    } else {
      requestAnimationFrame(loop);
    }
  };

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
    // Fade out
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  };

  // ----- Input handling -----
  const handleJump = () => {
    if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  };
  canvas.addEventListener('click', handleJump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); handleJump(); }, {passive:false});

  // Play collision sound when game over
  const triggerGameOver = () => {
    gameOver = true;
    playTone(200, 0.3);
  };

  // Modify collision detection to use triggerGameOver
  // (Will be applied in loop below)

  // Start the animation loop
  loop();
});
