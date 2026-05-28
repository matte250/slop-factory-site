// Simple Neon Runner – side‑scroll endless runner
// Canvas with id="game" must exist in the page

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const GRAVITY = 0.6;
  const JUMP = -12;
  const PLAYER_SPEED = 3; // world scroll speed

  const player = {
    x: 50,
    y: canvas.height - 60,
    w: 40,
    h: 40,
    vy: 0,
    onGround: true,
  };

  const obstacles = [];
  const stars = [];
  let spawnCounter = 0;
  let score = 0;
  let gameOver = false;

  const keyDown = (e) => {
if (e.code === 'Space' || e.type === 'mousedown') {
        if (player.onGround) {
          player.vy = JUMP;
          player.onGround = false;
          playTone(400, 0.1); // jump sound
        }
      }
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('mousedown', keyDown);

  function spawnObstacle() {
    const height = 30 + Math.random() * 30;
    const gap = 120 + Math.random() * 80; // gap between floor and obstacle top
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height,
      w: 30 + Math.random() * 20,
      h: height,
    });
  }

  function update() {
    // Update stars (parallax background)
    if (Math.random() < 0.05) {
      stars.push({ x: canvas.width, y: Math.random() * canvas.height });
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= 1; // slower than obstacles
      if (s.x < 0) stars.splice(i, 1);
    }

    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // floor collision
    if (player.y + player.h >= canvas.height) {
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= PLAYER_SPEED;
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn logic
    spawnCounter++;
    if (spawnCounter > 90) { // approx every 1.5 sec at 60fps
      spawnObstacle();
      spawnCounter = 0;
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
          playTone(200, 0.3); // game over sound
        break;
      }
    }

    if (!gameOver) score++;
  }

  function draw() {
    // Clear with background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars (twinkling)
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#fff';
    for (const s of stars) {
        ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.shadowBlur = 0; // reset for game objects

    // Helper: draw rounded rect
    function drawRoundedRect(x, y, w, h, radius, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // Draw player with neon glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    drawRoundedRect(player.x, player.y, player.w, player.h, 8, '#0ff');
    ctx.shadowBlur = 0;

    // Draw obstacles with a red neon glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f0f';
    for (const o of obstacles) {
        drawRoundedRect(o.x, o.y, o.w, o.h, 4, '#f0f');
    }
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f80';
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }

    
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
