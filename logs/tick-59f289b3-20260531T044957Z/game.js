// Simple endless runner targeting <canvas id="game">
// Player: 20x20 square, auto‑runs right, jumps with Space, slides with Down Arrow

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 400;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const GROUND_Y = HEIGHT - PLAYER_SIZE;
  const SCROLL_SPEED = 4;

  let player = {
    x: 50,
    y: GROUND_Y,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    sliding: false,
  };

  const obstacles = [];
  let frames = 0;
  let gameOver = false;

  function spawnObstacle() {
    const height = Math.random() < 0.5 ? PLAYER_SIZE * 2 : PLAYER_SIZE;
    const width = PLAYER_SIZE * (Math.random() < 0.5 ? 1 : 2);
    const y = height > PLAYER_SIZE ? GROUND_Y - height : GROUND_Y - PLAYER_SIZE; // high vs low
    obstacles.push({ x: WIDTH, y, width, height });
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
    }
    // slide reduces height
    if (player.sliding) {
      player.height = PLAYER_SIZE / 2;
    } else {
      player.height = PLAYER_SIZE;
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      // remove off‑screen
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    // spawn obstacles periodically
    if (frames % 120 === 0) spawnObstacle();

    // collision detection
    for (const o of obstacles) {
      const colliding =
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y;
      if (colliding) {
        gameOver = true;
        break;
      }
    }

    frames++;
  }

  function draw() {
    // Background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#e0f7ff'); // pale cyan
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ground platform
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, GROUND_Y + PLAYER_SIZE, WIDTH, HEIGHT - (GROUND_Y + PLAYER_SIZE));

    // Player (rounded rectangle with a simple eye)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 4);
    ctx.fill();
    // eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + player.width * 0.7, player.y + player.height * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles (random pastel colors)
    for (const o of obstacles) {
      const hue = (o.x / WIDTH) * 360; // varying hue based on position
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      ctx.textAlign = 'start';
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playTone(440, 0.1); }
  function playSlide() { playTone(200, 0.08); }
  function playGameOver() { playTone(100, 0.5); }

  // controls
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.y === GROUND_Y) {
      player.vy = JUMP_VELOCITY;
      playJump();
    }
    if (e.code === 'ArrowDown') {
      player.sliding = true;
      playSlide();
    }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') player.sliding = false;
  });

  // play game over sound in draw when needed
  const originalDraw = draw;
  function draw() {
    originalDraw();
    if (gameOver && !gameOverSoundPlayed) {
      playGameOver();
      gameOverSoundPlayed = true;
    }
  }
  let gameOverSoundPlayed = false;

  // start
  loop();
})();
