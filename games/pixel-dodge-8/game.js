// Simple 'Pixel Dodge' endless runner
// Canvas element with id="game" must exist in the HTML.

(() => {
    const canvas = document.getElementById('game');
    if (!canvas) return console.error('Canvas with id "game" not found');
    const ctx = canvas.getContext('2d');
    // Audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, duration) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }
  const width = canvas.width = 800;
  const height = canvas.height = 200;

  // Player
  const player = {
    x: 50,
    y: height - 30,
    w: 20,
    h: 20,
    vy: 0,
    jumpStrength: -6,
    onGround: true,
    color: '#4caf50', // greener
    radius: 4,
  };

  // Helper: draw rounded rectangles  // Helper: draw rounded rectangles
  function drawRoundedRect(x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }


  const GRAVITY = 0.3;

  // Obstacles
  const obstacles = [];
  const obstacleW = 20;
  const obstacleH = 40;
  const obstacleSpeed = 3;
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    obstacles.push({
      x: width,
      y: height - obstacleH,
      w: obstacleW,
      h: obstacleH,
    });
  }

  function update() {
    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= height) {
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn obstacles
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        // Play collision sound
        playTone(150, 0.3);
        break;
      }
    }

    score++;
  }

  function draw() {
    // Background sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#4682b4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // Ground
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);
    // Player
    ctx.fillStyle = player.color;
    drawRoundedRect(player.x, player.y, player.w, player.h, player.radius, player.color);
    // Obstacles (draw on top of ground)
    ctx.fillStyle = '#ff5722';
    obstacles.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 4, '#ff5722'));
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input: space bar or click to jump
  function jump() {
    // Ensure audio context is running (required after user interaction)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      // Play jump sound
      playTone(440, 0.08);
    }
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  // Start game loop
  loop();
})();
