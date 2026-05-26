// Endless Canvas Runner
// Player: square that runs left‑to‑right, jumps on click/tap, ducks with down arrow.
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Audio context and simple tone function
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Canvas size (adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 200;

  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 30;
  const PLAYER_X = 50; // fixed x position
  const GROUND_Y = canvas.height - PLAYER_SIZE;

  let playerY = GROUND_Y;
  let playerVY = 0;
  let ducking = false;
  let score = 0;
  let scrollX = 0;

  const obstacles = [];
  const OBSTACLE_FREQ = 1500; // ms between obstacles
  const OBSTACLE_SPEED = 3;
  // Clouds for background
  const clouds = [];
  const CLOUD_FREQ = 3000; // ms between clouds
  const CLOUD_SPEED = 0.5;
  let lastCloud = Date.now();

  // Input handling
  const jump = () => {
    if (playerY >= GROUND_Y) {
      playerVY = JUMP_SPEED;
      playTone(440, 0.1); // jump sound
    }
  };
  const duck = (down) => {
    ducking = down;
  };
  window.addEventListener('mousedown', jump);
  window.addEventListener('touchstart', jump);
  window.addEventListener('keydown', (e) => { if (e.code === 'ArrowDown') duck(true); });
  window.addEventListener('keyup', (e) => { if (e.code === 'ArrowDown') duck(false); });

  // Obstacle creator
  const createObstacle = () => {
    // also possibly create cloud
    const now = Date.now();
    if (now - lastCloud > CLOUD_FREQ) {
      createCloud();
      lastCloud = now;
    }
    // Randomly choose gap (height) or low obstacle
    const type = Math.random() < 0.5 ? 'gap' : 'block';
    if (type === 'gap') {
      obstacles.push({type, x: canvas.width + scrollX, width: 60}); // gap width
    } else {
      const height = 20 + Math.random() * 40;
      obstacles.push({type, x: canvas.width + scrollX, width: 20, height});
    }
  };

  // Create a simple cloud object
  const createCloud = () => {
    const radius = 15 + Math.random() * 10;
    const x = canvas.width + radius;
    const y = 20 + Math.random() * (GROUND_Y - 80);
    clouds.push({x, y, radius});
  };
  let lastObstacle = Date.now();

  const gameLoop = () => {
    // Update player
    playerVY += GRAVITY;
    playerY += playerVY;
    if (playerY > GROUND_Y) playerY = GROUND_Y;
    // Duck reduces player height
    const playerDrawHeight = ducking ? PLAYER_SIZE / 2 : PLAYER_SIZE;
    const playerDrawY = ducking ? playerY + PLAYER_SIZE / 2 : playerY;

    // Update obstacles
    const now = Date.now();
    if (now - lastObstacle > OBSTACLE_FREQ) {
      createObstacle();
      lastObstacle = now;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= OBSTACLE_SPEED;
      // Collision detection (simple AABB)
      if (obs.type === 'block') {
        const obsY = GROUND_Y - obs.height;
        const playerRect = {x: PLAYER_X, y: playerDrawY, w: PLAYER_SIZE, h: playerDrawHeight};
        const obsRect = {x: obs.x, y: obsY, w: obs.width, h: obs.height};
        if (playerRect.x < obsRect.x + obsRect.w &&
            playerRect.x + playerRect.w > obsRect.x &&
            playerRect.y < obsRect.y + obsRect.h &&
            playerRect.y + playerRect.h > obsRect.y) {
          // Game over
playTone(150, 0.3); // game over sound
           alert('Game Over! Score: ' + Math.floor(score));
           document.location.reload();
          return;
        }
      } else { // gap
        // If player is on ground and within gap range -> fall
        if (playerY >= GROUND_Y &&
            PLAYER_X + PLAYER_SIZE > obs.x &&
            PLAYER_X < obs.x + obs.width) {
          // fall into gap
playTone(150, 0.3); // game over sound
           alert('Game Over! Score: ' + Math.floor(score));
           document.location.reload();
          return;
        }
      }
      // Remove off‑screen obstacles
      if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#ADD8E6'); // softer blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Sun (simple)
    ctx.fillStyle = 'rgba(255,223,0,0.8)';
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    // Clouds (simple fluffy)
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.arc(c.x - c.radius * 0.6, c.y + c.radius * 0.3, c.radius * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x + c.radius * 0.6, c.y + c.radius * 0.3, c.radius * 0.8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    });
    // Update and recycle clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
      const cl = clouds[i];
      cl.x -= CLOUD_SPEED;
      if (cl.x + cl.radius < 0) clouds.splice(i, 1);
    }
    // Ground rectangle
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, GROUND_Y + PLAYER_SIZE, canvas.width, canvas.height - (GROUND_Y + PLAYER_SIZE));
    // Player (rounded rectangle with gradient)
    const playerGrad = ctx.createLinearGradient(PLAYER_X, playerDrawY, PLAYER_X, playerDrawY + playerDrawHeight);
    playerGrad.addColorStop(0, '#4CAF50');
    playerGrad.addColorStop(1, '#2E7D32');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    const radius = 5;
    ctx.moveTo(PLAYER_X + radius, playerDrawY);
    ctx.lineTo(PLAYER_X + PLAYER_SIZE - radius, playerDrawY);
    ctx.quadraticCurveTo(PLAYER_X + PLAYER_SIZE, playerDrawY, PLAYER_X + PLAYER_SIZE, playerDrawY + radius);
    ctx.lineTo(PLAYER_X + PLAYER_SIZE, playerDrawY + playerDrawHeight - radius);
    ctx.quadraticCurveTo(PLAYER_X + PLAYER_SIZE, playerDrawY + playerDrawHeight, PLAYER_X + PLAYER_SIZE - radius, playerDrawY + playerDrawHeight);
    ctx.lineTo(PLAYER_X + radius, playerDrawY + playerDrawHeight);
    ctx.quadraticCurveTo(PLAYER_X, playerDrawY + playerDrawHeight, PLAYER_X, playerDrawY + playerDrawHeight - radius);
    ctx.lineTo(PLAYER_X, playerDrawY + radius);
    ctx.quadraticCurveTo(PLAYER_X, playerDrawY, PLAYER_X + radius, playerDrawY);
    ctx.closePath();
    ctx.fill();
    // Obstacles with simple shading
    obstacles.forEach(o => {
      if (o.type === 'block') {
        const obsGrad = ctx.createLinearGradient(o.x, GROUND_Y - o.height, o.x, GROUND_Y);
        obsGrad.addColorStop(0, '#8B0000'); // dark red top
        obsGrad.addColorStop(1, '#B22222'); // lighter red bottom
        ctx.fillStyle = obsGrad;
        ctx.fillRect(o.x, GROUND_Y - o.height, o.width, o.height);
      } else {
        // Gap – render as transparent (no draw needed)
        // Optionally draw a subtle line for visual cue
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(o.x, GROUND_Y + PLAYER_SIZE / 2);
        ctx.lineTo(o.x + o.width, GROUND_Y + PLAYER_SIZE / 2);
        ctx.stroke();
      }
    });
    // Score
    score += 0.05;
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    requestAnimationFrame(gameLoop);
  };

  requestAnimationFrame(gameLoop);
})();
