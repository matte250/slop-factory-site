// Minimal gravity‑shift endless runner
// Canvas element with id="game"

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 400;

  // player
  const PLAYER_W = 30;
  const PLAYER_H = 30;
  const SPEED_X = 2; // forward speed (scroll)
  let playerX = 50;
  let playerY = HEIGHT - PLAYER_H; // starts on floor
  let gravity = 1; // 1 = down, -1 = up
  const GRAVITY_ACCEL = 0.4;
  let velY = 0;

  // obstacles: array of {x, y, w, h}
  const obstacles = [];
  const OBSTACLE_W = 30;
  const GAP_MIN = 150;
  const GAP_MAX = 300;
  let nextObstacleX = WIDTH;

  function spawnObstacle() {
    // randomly decide whether obstacle is on floor or ceiling
    const onFloor = Math.random() < 0.5;
    const y = onFloor ? HEIGHT - 20 : 0; // 20px thick bar
    obstacles.push({ x: nextObstacleX, y, w: OBSTACLE_W, h: 20 });
    // schedule next obstacle
    const gap = GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
    nextObstacleX += OBSTACLE_W + gap;
  }

  // initial obstacles
  for (let i = 0; i < 5; i++) spawnObstacle();

  // input – space toggles gravity
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      resumeAudio();
      gravity = -gravity; // flip direction
      // give player a small push to avoid sticking to surface
      velY = -gravity * 5;
      // sound for gravity flip
      playBeep(400, 0.1);
    }
  });

  function update() {
    // apply gravity
    velY += GRAVITY_ACCEL * gravity;
    playerY += velY;

    // keep player attached to surface when beyond bounds
    if (gravity === 1 && playerY + PLAYER_H > HEIGHT) {
      playerY = HEIGHT - PLAYER_H;
      velY = 0;
    }
    if (gravity === -1 && playerY < 0) {
      playerY = 0;
      velY = 0;
    }

    // move obstacles left
    for (const o of obstacles) o.x -= SPEED_X;
    // remove passed obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // add new obstacles as needed
    if (nextObstacleX - playerX < WIDTH) spawnObstacle();
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function checkCollisions() {
    const playerRect = { x: playerX, y: playerY, w: PLAYER_W, h: PLAYER_H };
    for (const o of obstacles) {
      if (rectIntersect(playerRect, o)) return true;
    }
    // falling off screen when flip mistimed
    if (playerY > HEIGHT || playerY + PLAYER_H < 0) return true;
    return false;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001d3d'); // dark night sky
    bgGrad.addColorStop(1, '#003566'); // lighter near horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw player as a circle with subtle shading
    const playerGrad = ctx.createRadialGradient(
      playerX + PLAYER_W / 2,
      playerY + PLAYER_H / 2,
      PLAYER_W / 8,
      playerX + PLAYER_W / 2,
      playerY + PLAYER_H / 2,
      PLAYER_W / 2
    );
    playerGrad.addColorStop(0, '#5ac8ff');
    playerGrad.addColorStop(1, '#0066cc');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(playerX + PLAYER_W / 2, playerY + PLAYER_H / 2, PLAYER_W / 2, 0, Math.PI * 2);
    ctx.fill();

    // draw obstacles with ceiling/floor distinction
    for (const o of obstacles) {
      if (o.y === 0) {
        // ceiling obstacle – orange
        ctx.fillStyle = '#ff851b';
      } else {
        // floor obstacle – red
        ctx.fillStyle = '#ff4136';
      }
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  function loop() {
    update();
    if (checkCollisions()) {
      // sound for collision/game over
      playBeep(150, 0.3);
      alert('Game Over');
      // reset state
      playerY = HEIGHT - PLAYER_H;
      gravity = 1;
      velY = 0;
      obstacles.length = 0;
      nextObstacleX = WIDTH;
      for (let i = 0; i < 5; i++) spawnObstacle();
      return;
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
