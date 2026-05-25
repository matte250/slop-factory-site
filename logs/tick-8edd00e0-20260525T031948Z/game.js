// Canvas Runner Game
// Implements the idea from IDEA.md: a side‑scrolling endless runner.
// The HTML contains <canvas id="game"></canvas>. This script initializes the canvas
// and starts the game loop.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Set canvas size (you can adjust as needed)
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const SCROLL_SPEED = 4;
  const OBSTACLE_WIDTH = 20;
  const GAP_WIDTH = 80;
  const SPAWN_INTERVAL = 1500; // ms

  // Player state
  const player = {
    x: 50,
    y: HEIGHT - PLAYER_SIZE,
    vy: 0,
    onGround: true,
  };

  // Ground representation: an array of segments. Each segment is {x, width, solid}
  // "solid" true means ground exists, false means a gap.
  let groundSegments = [{ x: 0, width: WIDTH, solid: true }];

  // Obstacles array: each {x, y, width, height}
  let obstacles = [];

  // Timing
  let lastSpawn = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  const jump = () => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      // Play jump sound (high‑pitched short tone)
      playTone(600, 0.1);
    }
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
  });
  canvas.addEventListener('click', jump);

  // Helper to add a new ground segment (solid or gap) at the right edge
  function addGroundSegment() {
    const last = groundSegments[groundSegments.length - 1];
    const solid = Math.random() > 0.3; // 70% chance solid, 30% gap
    const width = solid ? OBSTACLE_WIDTH * 2 + Math.random() * 100 : GAP_WIDTH;
    groundSegments.push({ x: last.x + last.width, width, solid });
  }

  // Helper to spawn an obstacle on a solid ground segment
  function maybeSpawnObstacle() {
    // Find the first solid segment that is currently on screen
    const segment = groundSegments.find(seg => seg.solid && seg.x + seg.width > player.x);
    if (!segment) return;
    // Random chance to add obstacle
    if (Math.random() < 0.4) {
      const obsHeight = PLAYER_SIZE * (0.8 + Math.random() * 0.6);
      obstacles.push({
        x: segment.x + segment.width - OBSTACLE_WIDTH,
        y: HEIGHT - PLAYER_SIZE - obsHeight,
        width: OBSTACLE_WIDTH,
        height: obsHeight,
      });
    }
  }

  function update(delta) {
    if (gameOver) return;
    // Update player physics
    player.vy += GRAVITY;
    player.y += player.vy;

    // Determine ground height at player.x
    const groundY = HEIGHT - PLAYER_SIZE;
    // Find current ground segment under player
    const currentSeg = groundSegments.find(seg => player.x >= seg.x && player.x < seg.x + seg.width);
    const onSolid = currentSeg && currentSeg.solid;
    if (onSolid && player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    } else if (!onSolid && player.y >= HEIGHT) {
      // Fell into a gap
      player.y = HEIGHT;
      player.vy = 0;
      player.onGround = false;
    }

    // Scroll world left
    groundSegments.forEach(seg => seg.x -= SCROLL_SPEED);
    obstacles.forEach(ob => ob.x -= SCROLL_SPEED);

    // Remove off‑screen parts
    while (groundSegments.length && groundSegments[0].x + groundSegments[0].width < 0) {
      groundSegments.shift();
    }
    while (obstacles.length && obstacles[0].x + obstacles[0].width < 0) {
      obstacles.shift();
    }

    // Extend ground if needed
    const rightEdge = groundSegments[groundSegments.length - 1].x + groundSegments[groundSegments.length - 1].width;
    if (rightEdge < WIDTH * 2) addGroundSegment();

    // Possibly spawn obstacle
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      maybeSpawnObstacle();
      lastSpawn = performance.now();
    }

    // Collision detection with obstacles
    for (const ob of obstacles) {
      if (
        player.x < ob.x + ob.width &&
        player.x + PLAYER_SIZE > ob.x &&
        player.y < ob.y + ob.height &&
        player.y + PLAYER_SIZE > ob.y
      ) {
          // Play collision sound (low-pitched short tone)
          playTone(200, 0.3);
          gameOver = true;
          break;
        }
      }
    }
  }

    }
  }

  function draw() {
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGradient.addColorStop(0, '#87CEEB'); // sky blue
    bgGradient.addColorStop(1, '#b3e5fc'); // lighter at horizon
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw ground with simple texture pattern
    const groundPatternCanvas = document.createElement('canvas');
    groundPatternCanvas.width = 20;
    groundPatternCanvas.height = 20;
    const gpCtx = groundPatternCanvas.getContext('2d');
    gpCtx.fillStyle = '#654321';
    gpCtx.fillRect(0, 0, 20, 20);
    gpCtx.fillStyle = '#7b543c';
    gpCtx.fillRect(0, 10, 20, 10);
    const groundPattern = ctx.createPattern(groundPatternCanvas, 'repeat');
    ctx.fillStyle = groundPattern;
    for (const seg of groundSegments) {
      if (seg.solid) {
        ctx.fillRect(seg.x, HEIGHT - PLAYER_SIZE, seg.width, PLAYER_SIZE);
      }
    }

    // Draw player as rounded square
    ctx.fillStyle = '#ff5722';
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + PLAYER_SIZE - radius, player.y);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y, player.x + PLAYER_SIZE, player.y + radius);
    ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE - radius);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE, player.x + PLAYER_SIZE - radius, player.y + PLAYER_SIZE);
    ctx.lineTo(player.x + radius, player.y + PLAYER_SIZE);
    ctx.quadraticCurveTo(player.x, player.y + PLAYER_SIZE, player.x, player.y + PLAYER_SIZE - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // Draw obstacles with a darker shade
    ctx.fillStyle = '#424242';
    for (const ob of obstacles) {
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Initialise first ground segment if empty (should already be)
  if (!groundSegments.length) addGroundSegment();

  requestAnimationFrame(loop);
})();
