// Canvas Runner Game
// Assumes an HTML canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 200;
  // Ground thickness for visual floor
  const GROUND_HEIGHT = 20;
  const GROUND_TOP = HEIGHT - GROUND_HEIGHT;
  const GROUND_Y = GROUND_TOP - PLAYER_SIZE;

  // ----- Sound setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playJumpSound() { playTone(300, 0.1); }
  function playGameOverSound() { playTone(100, 0.5); }


  const player = {
    x: 50,
    y: GROUND_Y,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    jump() {
      if (this.onGround()) {
        this.vy = JUMP_STRENGTH;
        playJumpSound();
      }
    },
    onGround() {
      return this.y >= GROUND_Y;
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y > GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
      }
    },
    draw() {
      // Draw player as a circle with gradient shading
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 4,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      gradient.addColorStop(0, '#a0ffa0');
      gradient.addColorStop(1, '#0f0');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const obstacles = [];
  let framesSinceLast = 0;
  const OBSTACLE_SPACING = 150; // frames between obstacles

  function spawnObstacle() {
    const size = 20 + Math.random() * 30; // variable height
    obstacles.push({
      x: WIDTH,
      y: GROUND_TOP - size, // align spike tip with ground
      width: size,
      height: size
    });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
    // spawn new obstacles
    framesSinceLast++;
    if (framesSinceLast > OBSTACLE_SPACING) {
      spawnObstacle();
      framesSinceLast = 0;
    }
  }

  function drawObstacles() {
    // Draw each obstacle as a dark triangle (spike)
    ctx.fillStyle = '#444';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, GROUND_TOP);
      ctx.lineTo(o.x + o.width / 2, GROUND_TOP - o.height);
      ctx.lineTo(o.x + o.width, GROUND_TOP);
      ctx.closePath();
      ctx.fill();
    });
  }

function drawGround() {
    ctx.fillStyle = '#654321'; // brown ground
    ctx.fillRect(0, GROUND_TOP, WIDTH, GROUND_HEIGHT);
}

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#87CEEB'); // sky blue
    grad.addColorStop(1, '#b3e5fc'); // lighter near horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  let gameOver = false;
  function loop() {
    if (gameOver) return;
    // Clear and redraw background and ground first
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    drawGround();
    player.update();
    player.draw();
    updateObstacles();
    drawObstacles();
    if (checkCollision()) {
      gameOver = true;
      playGameOverSound();
      ctx.fillStyle = '#000';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 80, HEIGHT / 2);
      return;
    }
    // gradually increase speed
    speed *= 1.0005;
    requestAnimationFrame(loop);
  }

  // Input handling (spacebar or click/tap)
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') player.jump();
  });
  canvas.addEventListener('mousedown', () => player.jump());

  // Start the game loop
  loop();
})();
