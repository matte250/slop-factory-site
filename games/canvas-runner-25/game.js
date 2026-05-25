// Canvas Runner Game – improved graphics with background and styled elements
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Sound management using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(name) {
    // Simple oscillator tones for different events
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (name === 'jump') {
      osc.frequency.value = 300; // jump tone
    } else if (name === 'gameover') {
      osc.frequency.value = 100; // low thump
    } else {
      return; // unknown sound
    }
    osc.type = 'square';
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.stop(audioCtx.currentTime + 0.2);
  }

  // Resize canvas to fill the window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game settings
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const PLAYER_SIZE = 40;
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_GAP = 200; // distance between obstacles
  const SPEED_START = 4;
  const SPEED_INCREMENT = 0.001; // per frame

  // State
  let speed = SPEED_START;
  let score = 0;
  let gameOver = false;

  // Helper: draw gradient background sky
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87ceeb'); // light sky blue
    grad.addColorStop(1, '#b0e0e6'); // pale turquoise
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Helper: draw ground
  function drawGround() {
    const groundHeight = 20;
    ctx.fillStyle = '#654321'; // brown ground
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
  }

  const player = {
    x: 80,
    y: canvas.height - PLAYER_SIZE - 20, // above ground
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    jump() {
      if (this.onGround) this.vy = JUMP_STRENGTH;
    },
    get onGround() {
      return this.y >= canvas.height - this.height - 20;
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y > canvas.height - this.height - 20) this.y = canvas.height - this.height - 20;
    },
    draw() {
      // Simple player: green square with a subtle shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#00cc66';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.restore();
    },
  };

  const obstacles = [];
  let obstacleTimer = 0;

  function spawnObstacle() {
    const height = Math.random() * (canvas.height * 0.5) + 30; // variable height
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height - 20,
      width: OBSTACLE_WIDTH,
      height,
    });
  }

  function updateObstacles() {
    obstacleTimer -= speed;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = OBSTACLE_GAP;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      if (ob.x + ob.width < 0) obstacles.splice(i, 1);
    }
  }

  function checkCollision() {
    for (const ob of obstacles) {
      const collides =
        player.x < ob.x + ob.width &&
        player.x + player.width > ob.x &&
        player.y < ob.y + ob.height &&
        player.y + player.height > ob.y;
      if (collides) return true;
    }
    return false;
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
  }

  function drawObstacles() {
    ctx.save();
    ctx.fillStyle = '#b22222'; // firebrick red
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    for (const ob of obstacles) {
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    }
    ctx.restore();
  }

  function gameLoop() {
    if (gameOver) return;
    // Background
    drawBackground();
    // Ground
    drawGround();

    // Update entities
    player.update();
    updateObstacles();
    speed += SPEED_INCREMENT;
    score += speed * 0.1;

    // Draw entities
    player.draw();
    drawObstacles();
    drawScore();

    // Collision detection
    if (checkCollision()) {
      gameOver = true;
      playSound('gameover');
      ctx.fillStyle = '#fff';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
      return;
    }

    requestAnimationFrame(gameLoop);
  }

  // Input – space bar or tap/click
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      audioCtx.resume();
      player.jump();
      playSound('jump');
    }
  });
  window.addEventListener('pointerdown', () => {
    audioCtx.resume();
    player.jump();
    playSound('jump');
  });

  // Start the loop
  gameLoop();
})();
