// Minimal endless runner targeting <canvas id="game">
// Square player jumps over spike obstacles synced to a simple beat.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game constants
  const GRAVITY = 0.8;
  const JUMP_VELOCITY = -15;
  const PLAYER_SIZE = 30;
  const PLAYER_X = 50; // fixed horizontal position
  const OBSTACLE_SPEED = 4; // pixels per frame
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_HEIGHT = 40;
  const BEAT_INTERVAL = 1000; // ms between spikes (1 beat)

  let lastObstacleTime = 0;
  let playerY = height - PLAYER_SIZE; // ground position
  let playerVY = 0;
  let obstacles = [];
  let running = true;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  };

  // Input: space bar or click/touch
  const jump = () => {
    if (playerY >= height - PLAYER_SIZE) {
      playerVY = JUMP_VELOCITY;
      // Ensure audio context is running (required after user gesture)
      audioCtx.resume();
      playTone(440, 0.1); // jump sound
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  const spawnObstacle = () => {
    obstacles.push({x: width, y: height - OBSTACLE_HEIGHT});
    // Beat sound with higher pitch
    playTone(660, 0.08);
  };

  const update = (delta) => {
    // Player physics
    playerVY += GRAVITY;
    playerY += playerVY;
    if (playerY > height - PLAYER_SIZE) {
      playerY = height - PLAYER_SIZE;
      playerVY = 0;
    }

    // Obstacle movement
    obstacles.forEach(o => o.x -= OBSTACLE_SPEED);
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + OBSTACLE_WIDTH > 0);

    // Collision detection (AABB vs AABB for simplicity)
    for (const o of obstacles) {
      if (
        PLAYER_X < o.x + OBSTACLE_WIDTH &&
        PLAYER_X + PLAYER_SIZE > o.x &&
        playerY < o.y + OBSTACLE_HEIGHT &&
        playerY + PLAYER_SIZE > o.y
      ) {
        running = false; // game over
        playTone(220, 0.3); // crash sound
        break;
      }
    }

    // Beat‑based obstacle spawning
    if (performance.now() - lastObstacleTime > BEAT_INTERVAL) {
      spawnObstacle();
      lastObstacleTime = performance.now();
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Background - vertical gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1a2a3a');
    bgGrad.addColorStop(1, '#080c12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Helper to draw rounded rectangle
    const drawRoundRect = (x, y, w, h, r) => {
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
    };

    // Player - white with subtle shadow
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    drawRoundRect(PLAYER_X, playerY, PLAYER_SIZE, PLAYER_SIZE, 6);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Obstacles (spikes as simple triangles with gradient)
    const spikeGrad = ctx.createLinearGradient(0, height - OBSTACLE_HEIGHT, 0, height);
    spikeGrad.addColorStop(0, '#ff5252');
    spikeGrad.addColorStop(1, '#b71c1c');
    ctx.fillStyle = spikeGrad;
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + OBSTACLE_HEIGHT);
      ctx.lineTo(o.x + OBSTACLE_WIDTH / 2, o.y);
      ctx.lineTo(o.x + OBSTACLE_WIDTH, o.y + OBSTACLE_HEIGHT);
      ctx.closePath();
      ctx.fill();
    });

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  let lastTime = 0;
  const loop = (timestamp) => {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (running) update(delta);
    draw();
    if (running) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
