// Simple endless runner targeting <canvas id="game"></canvas>
// Pixel Runner – based on IDEA.md

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Player definition
  const PLAYER_SIZE = 10;
  const PLAYER_X = 30; // fixed horizontal position
  let playerY = HEIGHT - PLAYER_SIZE;
  let vY = 0;
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;

  // Obstacles
  const OBSTACLE_W = 10;
  const OBSTACLE_H = 20;
  const OBSTACLE_SPEED = 3;
  const SPAWN_INTERVAL = 1500; // ms
  let obstacles = [];
  let lastSpawn = 0;

  let gameOver = false;
  let score = 0; // distance based score
  let lastScoreThreshold = 0; // track score milestones

  let audioInitialized = false;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  const keyDown = (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      if (!audioInitialized) {
        audioCtx.resume();
        audioInitialized = true;
      }
      if (playerY >= HEIGHT - PLAYER_SIZE) {
        vY = JUMP_STRENGTH;
        playTone(440, 0.1); // jump sound
      }
    }
  };
  window.addEventListener('keydown', keyDown);

  const spawnObstacle = () => {
    const height = OBSTACLE_H + Math.random() * 20;
    obstacles.push({ x: WIDTH, y: HEIGHT - height, w: OBSTACLE_W, h: height });
  };

  const update = (delta) => {
    if (gameOver) return;
    // Player physics
    vY += GRAVITY;
    playerY += vY;
    if (playerY > HEIGHT - PLAYER_SIZE) {
      playerY = HEIGHT - PLAYER_SIZE;
      vY = 0;
    }
    // Obstacles movement
    obstacles.forEach(o => (o.x -= OBSTACLE_SPEED));
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // Spawn new obstacles
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
    // Collision detection
    for (const o of obstacles) {
      if (
        PLAYER_X < o.x + o.w &&
        PLAYER_X + PLAYER_SIZE > o.x &&
        playerY < o.y + o.h &&
        playerY + PLAYER_SIZE > o.y
      ) {
        if (!audioInitialized) { audioCtx.resume(); audioInitialized = true; }
playTone(200, 0.3); // collision sound
gameOver = true;
        break;
      }
    }
    // Increment score based on time survived
    score += delta * 0.01; // simple distance metric
  };

  const draw = () => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#89CFF0'); // sky blue
    grad.addColorStop(1, '#72A0C1'); // deeper
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ground strip
    ctx.fillStyle = '#555';
    ctx.fillRect(0, HEIGHT - 5, WIDTH, 5);

    // Draw player (pixel)
    ctx.fillStyle = '#0000FF'; // blue player
    ctx.fillRect(PLAYER_X, playerY, PLAYER_SIZE, PLAYER_SIZE);

    // Draw obstacles with varying shades of red
    obstacles.forEach(o => {
      const shade = Math.min(255, 150 + o.x % 100);
      ctx.fillStyle = `rgb(${shade},0,0)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      ctx.fillText('Score: ' + Math.floor(score), WIDTH / 2, HEIGHT / 2 + 30);
    }
  };

  let lastTime = 0;
  const loop = (time) => {
    const delta = time - lastTime;
    lastTime = time;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
