// Simple endless runner targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.6;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const JUMP = -12;
  const PLAYER = { x: 50, y: 0, w: 30, h: 50, vy: 0, onGround: false };
  const GROUND_Y = canvas.height - 30;
  let obstacles = [];
  let spawnTimer = 0;
  let speed = 4;
  let score = 0;
  let running = true;

  const reset = () => {
    PLAYER.y = GROUND_Y - PLAYER.h;
    PLAYER.vy = 0;
    PLAYER.onGround = true;
    obstacles = [];
    spawnTimer = 0;
    speed = 4;
    score = 0;
    running = true;
    loop();
  };

  const jump = () => {
    if (PLAYER.onGround) {
      // Ensure audio context is running (required by some browsers)
      if (audioCtx.state !== 'running') audioCtx.resume();
      PLAYER.vy = JUMP;
      PLAYER.onGround = false;
      // Jump sound: higher pitch
      playBeep(660, 0.08);
    }
  };

  // Input handling (space or click/tap)
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  const spawnObstacle = () => {
    const size = Math.random() * 20 + 20; // 20-40px
    obstacles.push({ x: canvas.width, y: GROUND_Y - size, w: size, h: size });
  };

  const update = () => {
    // Player physics
    PLAYER.vy += GRAVITY;
    PLAYER.y += PLAYER.vy;
    if (PLAYER.y + PLAYER.h >= GROUND_Y) {
      PLAYER.y = GROUND_Y - PLAYER.h;
      PLAYER.vy = 0;
      PLAYER.onGround = true;
    }

    // Obstacles movement and spawning
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = Math.max(60 - speed * 5, 20); // faster spawn as speed rises
    }
    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // Collision detection
    for (let o of obstacles) {
      if (
        PLAYER.x < o.x + o.w &&
        PLAYER.x + PLAYER.w > o.x &&
        PLAYER.y < o.y + o.h &&
        PLAYER.y + PLAYER.h > o.y
      ) {
        // Play collision sound
        playBeep(220, 0.2);
        running = false;
        break;
      }
    }

    // Score & speed increase
    score++;
    if (score % 500 === 0) speed += 0.5;
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // --- Improved Graphics ---
    // Parallax background layers
    const bgLayers = [
      { // distant hills
        speed: 0.3,
        color: '#3b7d35',
        draw: offset => {
          ctx.fillStyle = '#3b7d35';
          ctx.beginPath();
          ctx.moveTo(-200 + offset, GROUND_Y - 80);
          ctx.lineTo(0 + offset, GROUND_Y - 120);
          ctx.lineTo(200 + offset, GROUND_Y - 80);
          ctx.lineTo(400 + offset, GROUND_Y - 130);
          ctx.lineTo(600 + offset, GROUND_Y - 80);
          ctx.lineTo(800 + offset, GROUND_Y - 110);
          ctx.lineTo(1000 + offset, GROUND_Y - 80);
          ctx.lineTo(1000, canvas.height);
          ctx.lineTo(0, canvas.height);
          ctx.closePath();
          ctx.fill();
        }
      },
      { // near hills
        speed: 0.6,
        color: '#5cb85c',
        draw: offset => {
          ctx.fillStyle = '#5cb85c';
          ctx.beginPath();
          ctx.moveTo(-200 + offset, GROUND_Y - 40);
          ctx.lineTo(0 + offset, GROUND_Y - 70);
          ctx.lineTo(200 + offset, GROUND_Y - 40);
          ctx.lineTo(400 + offset, GROUND_Y - 80);
          ctx.lineTo(600 + offset, GROUND_Y - 40);
          ctx.lineTo(800 + offset, GROUND_Y - 60);
          ctx.lineTo(1000 + offset, GROUND_Y - 40);
          ctx.lineTo(1000, canvas.height);
          ctx.lineTo(0, canvas.height);
          ctx.closePath();
          ctx.fill();
        }
      }
    ];

    // Helper to draw scrolling background
    const drawBackground = () => {
      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#87ceeb');
      grad.addColorStop(1, '#fff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax hills
      bgLayers.forEach(layer => {
        const offset = (Date.now() / 20 * layer.speed) % 1000; // repeat every 1000px
        layer.draw(-offset);
        layer.draw(1000 - offset);
      });
    };

    // Ground with subtle pattern
    const drawGround = () => {
      const groundHeight = canvas.height - GROUND_Y;
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 20; patternCanvas.height = groundHeight;
      const pctx = patternCanvas.getContext('2d');
      pctx.fillStyle = '#444';
      pctx.fillRect(0, 0, 20, groundHeight);
      pctx.fillStyle = '#555';
      pctx.fillRect(0, 0, 20, groundHeight / 2);
      const pattern = ctx.createPattern(patternCanvas, 'repeat-x');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, GROUND_Y, canvas.width, groundHeight);
    };

    // Draw player as a simple silhouette (rounded rectangle)
    const drawPlayer = () => {
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(PLAYER.x, PLAYER.y + PLAYER.h);
      ctx.lineTo(PLAYER.x, PLAYER.y + 10);
      ctx.quadraticCurveTo(PLAYER.x, PLAYER.y, PLAYER.x + 10, PLAYER.y);
      ctx.lineTo(PLAYER.x + PLAYER.w - 10, PLAYER.y);
      ctx.quadraticCurveTo(PLAYER.x + PLAYER.w, PLAYER.y, PLAYER.x + PLAYER.w, PLAYER.y + 10);
      ctx.lineTo(PLAYER.x + PLAYER.w, PLAYER.y + PLAYER.h);
      ctx.closePath();
      ctx.fill();
    };

    // Obstacles as spikes (triangles)
    const drawObstacles = () => {
      ctx.fillStyle = '#c33';
      obstacles.forEach(o => {
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      });
    };

    // --- Rendering sequence ---
    drawBackground();
    drawGround();
    drawPlayer();
    drawObstacles();

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 30);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 20);
    }

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 30);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  };

  const loop = () => {
    if (!running) {
      draw();
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Restart on click after game over
  canvas.addEventListener('click', () => {
    if (!running) reset();
  });

  // Start the game
  reset();
})();
