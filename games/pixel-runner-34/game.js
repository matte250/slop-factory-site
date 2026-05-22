// Pixel Runner – minimalist side‑scroller
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 200;

  // Player (single pixel)
  const player = {x: 50, y: HEIGHT - 20, w: 2, h: 2, vy: 0, onGround: true};
  const GRAVITY = 0.4;
  const JUMP_STRENGTH = -7;

  // Obstacles – simple rectangles moving left
  let obstacles = [];
  const OBSTACLE_SPACING = 150; // distance between obstacles
  let nextObstacleX = WIDTH + 200;

  let score = 0;
  let gameOver = false;

  // Input handling
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };

  const playJumpSound = () => playTone(440, 0.1);
  const playGameOverSound = () => playTone(150, 0.5);

  const jump = () => {
    if (player.onGround) {
      player.vy = JUMP_STRENGTH;
      player.onGround = false;
      playJumpSound();
    }
  };
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  const addObstacle = () => {
    // Random height 10‑30, width 10‑20, create a gap by leaving space above ground
    const height = 10 + Math.random() * 30;
    const width = 10 + Math.random() * 10;
    obstacles.push({x: nextObstacleX, y: HEIGHT - height, w: width, h: height});
    nextObstacleX += OBSTACLE_SPACING + Math.random() * 100;
  };

  const update = () => {
    if (gameOver) return;
    // Physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= HEIGHT - 20) { // ground line at y = HEIGHT-20
      player.y = HEIGHT - 20;
      player.vy = 0;
      player.onGround = true;
    }
    // Move obstacles leftward
    obstacles.forEach(o => o.x -= 2);
    // Remove passed obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // Add new obstacle if needed
    if (nextObstacleX < WIDTH) addObstacle();
    // Collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        playGameOverSound();
        break;
      }
    }
    // Score based on time / distance
    score += 0.1;
    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    // Sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#fff'); // near the horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);

    // Player – draw as a small circle for smoother look
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0';
    ctx.fill();

    // Obstacles – give each a random shade of red/orange for visual variety
    obstacles.forEach((o, i) => {
      const hue = 10 + (i * 30) % 30; // varying hue between 10-40
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    // Game over overlay – darker with larger text
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 60, HEIGHT / 2);
    }
  };

  // Kick off
  addObstacle();
  update();
})();
