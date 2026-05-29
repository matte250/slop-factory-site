// Minimal endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a tone
  const playTone = (freq, duration = 0.1, type = 'square') => {
    const gain = audioCtx.createGain();
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => playTone(300, 0.08);
  const playCollisionSound = () => playTone(100, 0.3, 'sawtooth');

  // Game settings
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 10;
  const OBSTACLE_WIDTH = 15;
  const OBSTACLE_GAP = 120; // distance between obstacles
  const OBSTACLE_SPEED = 3;
  const GROUND_HEIGHT = 20; // height of ground strip

  let score = 0;
  let frame = 0;

  const player = {
    x: 50,
    // Start on ground above the ground strip
    y: height - GROUND_HEIGHT - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
  };

  const obstacles = [];

  // Input – tap / click to jump
  const jump = () => {
    // Ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    }
  };
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  const spawnObstacle = () => {
    const height = Math.random() * (height * 0.5) + 20; // random height
    obstacles.push({
      x: width,
      y: height > height / 2 ? 0 : height - height, // simple top or bottom obstacle
      w: OBSTACLE_WIDTH,
      h: height,
    });
  };

  const update = () => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // Land on ground strip
    const groundY = height - GROUND_HEIGHT - player.height;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // Remove off‑screen
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      } else {
        // Collision detection
        const collides =
          player.x < o.x + o.w &&
          player.x + player.width > o.x &&
          player.y < o.y + o.h &&
          player.y + player.height > o.y;
        if (collides) {
          // Play collision sound
          playCollisionSound();
          // Game over – stop animation
          cancelAnimationFrame(animationId);
          alert('Game Over! Score: ' + score);
          return;
        }
      }
    }

    // Spawn new obstacles at intervals
    if (frame % Math.round(OBSTACLE_GAP / OBSTACLE_SPEED) === 0) {
      spawnObstacle();
    }
    frame++;
  };

  const draw = () => {
    // Background gradient (sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB'); // light sky blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground
    const groundHeight = 20;
    ctx.fillStyle = '#654321'; // brown ground
    ctx.fillRect(0, height - groundHeight, width, groundHeight);

    // Player (draw as circle for smoother look)
    ctx.fillStyle = '#00FF00'; // bright green
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles (random pastel colors)
    obstacles.forEach(o => {
      const hue = Math.floor(Math.random() * 360);
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Score (larger font, shadow)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('Score: ' + score, 10, 30);
    // Reset shadow for next frames
    ctx.shadowColor = 'transparent';
  };

  let animationId;
  const loop = () => {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  };
  loop();
})();
