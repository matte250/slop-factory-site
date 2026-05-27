// Canvas Escape – improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize canvas to full window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const PLAYER_SPEED = 3;
  const OBSTACLE_SPACING = 300; // distance between obstacles

  // Player state
  const player = {
    x: 80,
    y: 0,
    size: 30,
    vy: 0,
    onGround: false,
  };

  const obstacles = [];
  let distanceSinceLast = 0;
  let gameOver = false;
  let score = 0;

  // Input – tap/click or space to jump
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (frequency, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  };
  const jump = () => {
    if (player.onGround) {
      player.vy = JUMP_STRENGTH;
      player.onGround = false;
      playBeep(440, 100); // jump sound
    }
  };
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') jump();
  });
  canvas.addEventListener('pointerdown', jump);

  const rectCollide = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const update = () => {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    const groundY = canvas.height - player.size - 20; // ground line offset
    if (player.y > groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }
    // forward movement
    player.x += PLAYER_SPEED;
    // obstacles movement (actually player moves, so obstacles shift left)
    obstacles.forEach(o => (o.x -= PLAYER_SPEED));
    // remove passed obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
      obstacles.shift();
      score++;
    }
    // generate new obstacles
    distanceSinceLast += PLAYER_SPEED;
    if (distanceSinceLast >= OBSTACLE_SPACING) {
      distanceSinceLast = 0;
      const height = 30 + Math.random() * 50;
      obstacles.push({
        x: canvas.width,
        y: canvas.height - height - 20,
        w: 30,
        h: height,
      });
    }
    // collision detection
    const playerRect = { x: player.x, y: player.y, w: player.size, h: player.size };
    for (const o of obstacles) {
if (rectCollide(playerRect, o)) {
          playBeep(200, 200); // collision sound
          gameOver = true;
          break;
        }
    }
  };

  const draw = () => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87ceeb'); // sky
    grad.addColorStop(1, '#f0e68c'); // ground
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Obstacles
    ctx.fillStyle = '#e74c3c';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    // Player with shadow and rounded corners
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.size, player.size, 6);
    ctx.fill();
    ctx.restore();

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 20, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
