// Simple endless runner targeting <canvas id="game"></canvas>
// Minimal implementation – player is a 20×20 square that can jump.

(() => {
  // Audio context for simple sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playJumpSound() { playBeep(440); }
  function playGameOverSound() { playBeep(150, 0.3); }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 200;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SCROLL_SPEED = 4;

  const player = { x: 50, y: HEIGHT - 40, w: 20, h: 20, vy: 0, onGround: true };
  const obstacles = [];
  let frames = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: WIDTH, y: HEIGHT - size, w: size, h: size });
  }

  function update() {
    if (gameOver) return;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= HEIGHT) {
      player.y = HEIGHT - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // collision
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playGameOverSound();
      gameOver = true;
      }
    }

    // spawn logic
    if (frames % 90 === 0) spawnObstacle();
    frames++;
  }

  function draw() {
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue top
    skyGrad.addColorStop(1, '#b0e0e6'); // lighter near ground
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ground with simple pattern
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, HEIGHT - groundHeight, WIDTH, groundHeight);
    // ground line
    ctx.fillStyle = '#444';
    ctx.fillRect(0, HEIGHT - groundHeight, WIDTH, 2);

    // Player as a rounded rectangle with gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#66ff66');
    playerGrad.addColorStop(1, '#009900');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 4);
    ctx.fill();

    // Obstacles with varying colors
    obstacles.forEach(o => {
      const hue = (o.x / WIDTH) * 360 % 360;
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input – space or click to jump
  function jump() {
    // Ensure AudioContext is running (required after user gesture)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      playJumpSound();
    }
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  loop();
})();
