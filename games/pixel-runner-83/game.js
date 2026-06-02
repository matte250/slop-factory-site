// Minimal endless runner with enhanced graphics for canvas id "game"
// Player is a rounded square and obstacles are triangular spikes.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const WIDTH = (canvas.width = canvas.clientWidth || 800);
  const HEIGHT = (canvas.height = canvas.clientHeight || 200);

  // ----- Game objects -----
  const player = {
    x: 50,
    y: HEIGHT - 30,
    w: 30,
    h: 30,
    vy: 0,
    onGround: true,
    color: '#4CAF50',
  };

  const obstacles = [];
  const OBSTACLE_FREQ = 1500; // ms between obstacles
  const SPEED = 2; // pixels per frame
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;

  let lastObstacleTime = 0;
  let score = 0;
  let gameOver = false;

  // ----- Input -----
  const jump = () => {
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playSound(520, 0.08); // jump sound
    }
  };
  canvas.addEventListener('pointerdown', jump);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
  });

  // ----- Helper -----
  function spawnObstacle() {
    const height = 20 + Math.random() * 30; // spike size
    obstacles.push({
      x: WIDTH,
      y: HEIGHT - height,
      w: 20,
      h: height,
      color: '#FF5722',
      type: 'spike',
    });
  }

  function update(delta) {
    if (gameOver) return;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= HEIGHT) {
      player.y = HEIGHT - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= SPEED;
      // remove off‑screen
      if (obs.x + obs.w < 0) obstacles.splice(i, 1);
    }

    // spawn new obstacles
    if (performance.now() - lastObstacleTime > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacleTime = performance.now();
    }

    // collision detection (AABB) with sound
    for (const obs of obstacles) {
      if (
        player.x < obs.x + obs.w &&
        player.x + player.w > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.h > obs.y
      ) {
        playSound(150, 0.2); // collision sound
        gameOver = true;
        break;
      }
    }

    // score increases with time
    score = Math.floor(performance.now() / 100);
  }

  function draw() {
    // clear with sky gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#87CEEB'); // sky blue
    gradient.addColorStop(0.7, '#87CEEB');
    gradient.addColorStop(1, '#228B22'); // ground green
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // draw ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - 1);
    ctx.lineTo(WIDTH, HEIGHT - 1);
    ctx.stroke();

    // draw player as rounded square
    ctx.fillStyle = player.color;
    const radius = 6;
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

    // draw obstacles as triangular spikes
    for (const obs of obstacles) {
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.moveTo(obs.x, HEIGHT);
      ctx.lineTo(obs.x + obs.w / 2, obs.y);
      ctx.lineTo(obs.x + obs.w, HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#FFF';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
