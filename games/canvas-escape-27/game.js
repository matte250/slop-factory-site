// Simple endless runner for canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 400;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const PLAYER_X = 80;

  // Player visual settings
  const PLAYER_COLOR = '#ff5722';
  const player = {
    y: HEIGHT - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    sliding: false,
    update() {
      if (!this.sliding) this.vy += GRAVITY;
      this.y += this.vy;
      // ground collision
      const groundY = HEIGHT - this.height;
      if (this.y > groundY) {
        this.y = groundY;
        this.vy = 0;
        this.sliding = false;
      }
    },
    draw() {
      // Draw player as a rounded rectangle for smoother look
      ctx.fillStyle = PLAYER_COLOR;
      const radius = 6;
      const x = PLAYER_X;
      const y = this.y;
      const w = this.width;
      const h = this.height;
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
  };

  const obstacles = [];
  const OBSTACLE_FREQ = 1500; // ms
  const OBSTACLE_SPEED = 6;
  let lastObstacle = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'low' : 'high'; // low: jump, high: slide
    const height = type === 'low' ? 30 : 60;
    const y = type === 'low' ? HEIGHT - height : HEIGHT - PLAYER_SIZE - height;
    obstacles.push({ x: WIDTH, y, width: 20, height, type });
  }

  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= OBSTACLE_SPEED;
      if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }
    if (Date.now() - lastObstacle > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacle = Date.now();
    }
  }

  function drawObstacles() {
    // Draw obstacles with color based on type
    obstacles.forEach(o => {
      ctx.fillStyle = o.type === 'low' ? '#e91e63' : '#3f51b5';
      ctx.fillRect(o.x, o.y, o.width, o.height);
    });
  }

  function drawBackground() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#87ceeb'); // light blue
    grad.addColorStop(1, '#b3e5fc'); // softer blue
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Ground
    ctx.fillStyle = '#795548';
    ctx.fillRect(0, HEIGHT - 10, WIDTH, 10);
  }

  function checkCollision() {
    for (const o of obstacles) {
      const px = PLAYER_X, py = player.y, pw = player.width, ph = player.height;
      if (px < o.x + o.width && px + pw > o.x && py < o.y + o.height && py + ph > o.y) {
        return true;
      }
    }
    return false;
  }

  function gameLoop(timestamp) {
    if (gameOver) return;
    drawBackground();
    player.update();
    player.draw();
    updateObstacles();
    drawObstacles();
    if (checkCollision()) {
      gameOver = true;
      playGameOver();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 80, HEIGHT / 2);
      ctx.fillText('Score: ' + Math.floor(score), WIDTH / 2 - 70, HEIGHT / 2 + 40);
      return;
    }
    score += 0.016; // approx per frame
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    requestAnimationFrame(gameLoop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration=0.1) {
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
  function playJump() { playTone(440); }
  function playSlide() { playTone(220); }
  function playGameOver() { playTone(110, 0.5); }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (player.vy === 0 && !player.sliding) {
        player.vy = JUMP_VELOCITY;
        playJump();
      }
    } else if (e.code === 'ArrowDown') {
      if (player.vy === 0) {
        player.sliding = true;
        player.height = PLAYER_SIZE / 2;
        player.y = HEIGHT - player.height;
        playSlide();
      }
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') {
      player.sliding = false;
      player.height = PLAYER_SIZE;
      player.y = HEIGHT - PLAYER_SIZE;
    }
  });
  // Start
  requestAnimationFrame(gameLoop);
})();
