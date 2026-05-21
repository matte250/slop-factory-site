// Pixel Runner – simple endless side‑scroll runner
// Canvas element with id="game" must exist in the HTML.
(() => {
  // Audio setup using Web Audio API (no external files)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (frequency, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => playTone(300, 0.05);
  const playGameOverSound = () => playTone(150, 0.4);

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 8;
  const GROUND_Y = H - 20;
  const OBSTACLE_FREQ = 1500; // ms
  const OBSTACLE_SPEED = 4;

  // Player state
  const player = { x: 50, y: GROUND_Y - PLAYER_SIZE, vy: 0, width: PLAYER_SIZE, height: PLAYER_SIZE };

  // Obstacles – simple rectangles
  const obstacles = [];

    let lastObstacle = 0;
    let playing = true;
    let gameOverPlayed = false;

  // Input – tap / space / click
  const jump = () => {
    if (!playing) return;
    // Ensure audio context is running (required after user gesture on some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.y >= GROUND_Y - PLAYER_SIZE) {
      player.vy = JUMP_SPEED;
      playJumpSound();
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  const update = (dt) => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > GROUND_Y - PLAYER_SIZE) {
      player.y = GROUND_Y - PLAYER_SIZE;
      player.vy = 0;
    }

    // Spawn obstacles
    if (Date.now() - lastObstacle > OBSTACLE_FREQ) {
      const isCircle = Math.random() < 0.5;
      if (isCircle) {
        const radius = 6;
        obstacles.push({ x: W, y: GROUND_Y - radius * 2, radius, type: 'circle' });
      } else {
        obstacles.push({ x: W, y: GROUND_Y - 12, width: 12, height: 12, type: 'rect' });
      }
      lastObstacle = Date.now();
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // Remove off‑screen
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    // Collision detection (supports rectangles and circles)
    for (const o of obstacles) {
      if (o.type === 'circle') {
        // Circle vs rectangle (player) collision
        const cx = o.x + o.radius;
        const cy = o.y + o.radius;
        // Find nearest point on player rect to circle centre
        const nearestX = Math.max(player.x, Math.min(cx, player.x + player.width));
        const nearestY = Math.max(player.y, Math.min(cy, player.y + player.height));
        const dx = cx - nearestX;
        const dy = cy - nearestY;
        if (dx * dx + dy * dy < o.radius * o.radius) {
          playing = false;
          if (!gameOverPlayed) { playGameOverSound(); gameOverPlayed = true; }
          break;
        }
      } else {
        // Rectangle vs rectangle collision (original logic)
        if (
          player.x < o.x + o.width &&
          player.x + player.width > o.x &&
          player.y < o.y + o.height &&
          player.y + player.height > o.y
        ) {
          playing = false;
          if (!gameOverPlayed) { playGameOverSound(); gameOverPlayed = true; }
          break;
        }
      }
    }
  };

  const draw = () => {
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue top
    skyGrad.addColorStop(1, '#b0e0e6'); // pale blue bottom
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground with simple texture (dark gray with a lighter strip)
    ctx.fillStyle = '#444';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, GROUND_Y - 4, W, 4);

    // Player – draw as a small triangle for a more dynamic look
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Obstacles – varied colors and shapes
    obstacles.forEach(o => {
      // alternate between red squares and orange circles
      if (o.type === 'circle') {
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(o.x + o.radius, o.y + o.radius, o.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#f44';
        ctx.fillRect(o.x, o.y, o.width, o.height);
      }
    });

    // Game over overlay
    if (!playing) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  let lastTime = 0;
  const loop = (timestamp) => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (playing) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
