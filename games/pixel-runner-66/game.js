// Simple endless runner for canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // audio context for simple sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = 800;
  const height = canvas.height = 400;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const PLAYER_SIZE = 30;
  const GROUND_Y = height - 60; // ground line
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_MIN_HEIGHT = 30;
  const OBSTACLE_MAX_HEIGHT = 80;
  const OBSTACLE_SPEED = 4;
  const SPAWN_INTERVAL = 1200; // ms

  // Player state
  const player = {
    x: 50,
    y: GROUND_Y - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    onGround: true,
  };

  // Obstacles array
  const obstacles = [];
  let lastSpawn = 0;
  let running = true;
  let score = 0;

  function reset() {
    player.y = GROUND_Y - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    lastSpawn = 0;
    score = 0;
    running = true;
    requestAnimationFrame(update);
  }

  function spawnObstacle() {
    const h = OBSTACLE_MIN_HEIGHT + Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
    obstacles.push({
      x: width,
      y: GROUND_Y - h,
      w: OBSTACLE_WIDTH,
      h,
    });
  }

  function update(timestamp) {
    if (!running) return;
    // clear
    ctx.clearRect(0, 0, width, height);

    // draw sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#87CEEB'); // light sky blue
    skyGrad.addColorStop(1, '#fff'); // horizon fade
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, GROUND_Y);
    // draw ground with gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, height);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#543210');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // draw player with gradient and rounded corners
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#00ff00');
    playerGrad.addColorStop(1, '#006400');
    ctx.fillStyle = playerGrad;
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

    // obstacle handling
    const now = performance.now();
    if (now - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = now;
    }
    // move & draw obstacles as spiky triangles with gradient
    const obstacleGrad = ctx.createLinearGradient(0, GROUND_Y, 0, height);
    obstacleGrad.addColorStop(0, '#aa0000');
    obstacleGrad.addColorStop(1, '#ff5555');
    ctx.fillStyle = obstacleGrad;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= OBSTACLE_SPEED;
      // draw a triangle spike
      ctx.beginPath();
      ctx.moveTo(ob.x, GROUND_Y);
      ctx.lineTo(ob.x + ob.w / 2, ob.y);
      ctx.lineTo(ob.x + ob.w, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      // collision detection
      if (
        player.x < ob.x + ob.w &&
        player.x + player.w > ob.x &&
        player.y < ob.y + ob.h &&
        player.y + player.h > ob.y
      ) {
        running = false;
        playSound(200, 0.2); // collision sound
      }
      // remove off‑screen
      if (ob.x + ob.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px monospace';
      ctx.fillText('Press R to restart', width / 2, height / 2 + 20);
      return;
    }

    requestAnimationFrame(update);
  }

  // input handling
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      if (player.onGround) {
        player.vy = JUMP_STRENGTH;
        player.onGround = false;
        playSound(400, 0.1); // jump sound
      }
      e.preventDefault();
    }
    if (!running && e.key.toLowerCase() === 'r') {
      reset();
    }
  });

  // start game
  reset();
})();
