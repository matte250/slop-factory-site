// Minimal Pixel Dodger game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Player (square)
  const player = {
    x: 50,
    y: H - GROUND_HEIGHT - 20,
    w: 20,
    h: 20,
    vy: 0,
    onGround: true,
  };
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const GROUND_HEIGHT = 20;
  // Audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    // Fade out
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  function playJump() { playTone(440, 0.1); }
  function playCrash() { playTone(100, 0.3); }


  // Obstacles (spikes/gaps implemented as rectangles)
  const obstacles = [];
  let obstacleTimer = 0;
  const OBSTACLE_INTERVAL = 90; // frames
  let speed = 3;
  let speedIncrement = 0.001;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 20 + Math.random() * 20; // varied width/height
    const gap = Math.random() < 0.2; // 20% chance of gap (no obstacle, just a hole)
    if (!gap) {
      obstacles.push({
        x: W,
        y: H - size,
        w: size,
        h: size,
      });
    }
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H - GROUND_HEIGHT) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // spawn logic
    if (obstacleTimer-- <= 0) {
      spawnObstacle();
      obstacleTimer = OBSTACLE_INTERVAL - Math.random() * 30;
    }

    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        playCrash();
        break;
      }
    }

    // speed & score progression
    speed += speedIncrement;
    score++;
  }

  function draw() {
    // Background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#1E90FF'); // deeper blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground strip
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - groundHeight, W, groundHeight);

    // Player – green rounded square
    ctx.fillStyle = '#00c853';
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // Obstacles – red spikes (triangles)
    ctx.fillStyle = '#d50000';
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    }

    // Score text - white with slight shadow
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.shadowColor = 'transparent';

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.font = '16px sans-serif';
      ctx.fillText('Click to restart', W / 2, H / 2 + 30);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // input handling
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.onGround && !gameOver) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJump();
    }
  });
  canvas.addEventListener('click', () => {
    if (gameOver) {
      // reset state
      obstacles.length = 0;
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
      speed = 3;
      score = 0;
      gameOver = false;
      obstacleTimer = 0;
    }
  });

  // start loop
  requestAnimationFrame(loop);
})();
