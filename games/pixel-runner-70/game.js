// Pixel Runner with enhanced graphics
// Target canvas: <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width = canvas.width || 800;
  const HEIGHT = canvas.height = canvas.height || 200;

  const GRAVITY = 0.6;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const jumpSound = () => beep(440, 0.1);
  const hitSound = () => beep(150, 0.3);
  // Ensure audio context is resumed on interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  const JUMP_VELOCITY = -12;
  const SPEED = 4; // obstacle speed (px/frame)
  const OBSTACLE_FREQ = 1500; // ms between obstacles

  const player = {
    x: 50,
    y: HEIGHT - 30,
    w: 30,
    h: 30,
    vy: 0,
    onGround: true,
    draw() {
      // player with gradient and rounded corners
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#4caf50');
      grad.addColorStop(1, '#1b5e20');
      drawRoundedRect(this.x, this.y, this.w, this.h, 4, grad);
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= HEIGHT) {
        this.y = HEIGHT - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
  };

  let obstacles = [];
  let lastObstacle = 0;
  let gameOver = false;

  function spawnObstacle() {
    const height = 20 + Math.random() * 40;
    obstacles.push({
      x: WIDTH,
      y: HEIGHT - height,
      w: 20,
      h: height,
    });
  }

  function updateObstacles(delta) {
    obstacles.forEach(o => o.x -= SPEED);
    // remove off‑screen
    obstacles = obstacles.filter(o => o.x + o.w > 0);
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  function drawRoundedRect(x, y, w, h, r, fillStyle) {
    ctx.fillStyle = fillStyle;
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
    ctx.fill();
  }

  function render() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#e0f7fa'); // light cyan
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - 1);
    ctx.lineTo(WIDTH, HEIGHT - 1);
    ctx.stroke();

    player.draw();
    // draw obstacles with varying pastel colors
    obstacles.forEach(o => {
      const hue = Math.floor(Math.random() * 360);
      const color = `hsl(${hue}, 70%, 60%)`;
      drawRoundedRect(o.x, o.y, o.w, o.h, 4, color);
    });
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      return;
    }
    if (timestamp - lastObstacle > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacle = timestamp;
    }
    player.update();
    updateObstacles(timestamp);
    if (checkCollision() || player.y > HEIGHT) {
      gameOver = true;
      hitSound();
    }
    render();
    requestAnimationFrame(loop);
  }

  // Input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      jumpSound();
    }
    // restart on Enter after game over
    if (e.code === 'Enter' && gameOver) {
      reset();
    }
  });

  function reset() {
    player.x = 50;
    player.y = HEIGHT - 30;
    player.vy = 0;
    player.onGround = true;
    obstacles = [];
    gameOver = false;
    lastObstacle = 0;
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
