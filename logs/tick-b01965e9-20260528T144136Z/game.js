// Minimal endless runner with improved graphics
// Assumes there is a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Ensure canvas fills its display size
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(400, 0.1); }
  function playGameOverSound() { playTone(100, 0.3); }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Game settings
  let speed = 4; // pixels per frame
  const speedIncrement = 0.001; // accelerate over time

  // Player properties
  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: height - 30,
    vy: 0,
    jumpStrength: -12,
    onGround: true,
  };

  // Obstacle properties (simple rectangles)
  const obstacles = [];
  const obstacleGap = 200; // distance between obstacles
  let lastObstacleX = width;

  // Input handling – space to jump
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.onGround) {
      // Ensure audio context is running
      if (audioCtx.state === 'suspended') audioCtx.resume();
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
    }
  });

  let distance = 0;

  function spawnObstacle() {
    // Random height and type (spike vs block) – simple block for now
    const h = 30 + Math.random() * 50;
    obstacles.push({
      w: 20,
      h,
      x: width,
      y: height - h,
    });
  }

  function update() {
    // Existing update logic remains unchanged

    // Move player
    player.vy += 0.6; // gravity
    player.y += player.vy;
    if (player.y >= height - player.h) {
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      // Remove off‑screen obstacles
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles based on distance
    if (width - lastObstacleX >= obstacleGap) {
      spawnObstacle();
      lastObstacleX = width;
    } else {
      lastObstacleX -= speed;
    }

    // Collision detection
    for (const obs of obstacles) {
      if (
        player.x < obs.x + obs.w &&
        player.x + player.w > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.h > obs.y
      ) {
        // Game over – stop loop
        cancelAnimationFrame(frameId);
        ctx.fillStyle = 'red';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', width / 2 - 80, height / 2);
        return;
      }
    }

    // Update speed and distance
    distance += speed;
    speed += speedIncrement;
  }

  function draw() {
    drawBackground();
    drawPlayer();
    drawObstacles();
    drawHUD();
    ctx.clearRect(0, 0, width, height);
    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Draw obstacles
    ctx.fillStyle = 'black';
    for (const obs of obstacles) {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
    // Draw distance
    ctx.fillStyle = 'green';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Distance: ${Math.floor(distance)}`, 10, 20);
  }

  function loop() {
    update();
    draw();
    frameId = requestAnimationFrame(loop);
  }

  let frameId = requestAnimationFrame(loop);
})();
