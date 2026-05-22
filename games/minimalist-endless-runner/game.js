// Minimalist Endless Runner
// Canvas with id="game" expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Player definition
  const player = {
    x: 50,
    y: HEIGHT - 30,
    size: 30,
    vy: 0,
    gravity: 0.8,
    jumpStrength: -15,
    onGround: true,
  };

  // Obstacles
  const obstacles = [];
  const obstacleSpeed = 4;
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  // Score
  let distance = 0;
  let speedIncreaseTimer = 0;
  let currentSpeed = obstacleSpeed;

  // Input handling
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      audioCtx.resume();
      jump();
    }
  });

  function update() {
    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y >= HEIGHT - player.size) {
      player.y = HEIGHT - player.size;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacles movement and generation
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      const height = 20 + Math.random() * 30;
      const width = 20 + Math.random() * 30;
      obstacles.push({ x: WIDTH, y: HEIGHT - height, w: width, h: height });
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= currentSpeed;
      // Remove off‑screen obstacles
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }

    // Collision detection (AABB)
    for (const obs of obstacles) {
      if (
        player.x < obs.x + obs.w &&
        player.x + player.size > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.size > obs.y
      ) {
        // Game over – reset state
        playTone(220, 0.5); // collision sound
        alert('Game Over! Distance: ' + Math.floor(distance));
        reset();
        return;
      }
    }

    // Score and speed increase
    distance += currentSpeed * 0.05;
    speedIncreaseTimer++;
    if (speedIncreaseTimer > 600) {
      speedIncreaseTimer = 0;
      currentSpeed += 0.5; // gradually speed up
    }
  }

  function draw() {
    // Background gradient (sky to ground)
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#87CEEB'); // sky blue
    grad.addColorStop(1, '#A0D8F1'); // light cyan
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, HEIGHT - 5, WIDTH, 5);

    // Draw player (rounded square with gradient)
    const pGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.size);
    pGrad.addColorStop(0, '#0b79d0');
    pGrad.addColorStop(1, '#5fa8f5');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.size, player.size, 5);
    ctx.fill();

    // Draw obstacles (varying colors)
    for (const obs of obstacles) {
      const oGrad = ctx.createLinearGradient(0, obs.y, 0, obs.y + obs.h);
      oGrad.addColorStop(0, '#d00b0b');
      oGrad.addColorStop(1, '#ff6b6b');
      ctx.fillStyle = oGrad;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Distance: ' + Math.floor(distance), 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function reset() {
    obstacles.length = 0;
    player.y = HEIGHT - player.size;
    player.vy = 0;
    player.onGround = true;
    distance = 0;
    currentSpeed = obstacleSpeed;
    speedIncreaseTimer = 0;
    obstacleTimer = 0;
  }

  // Start the game loop
  loop();
})();
