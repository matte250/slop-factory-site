// Simple endless runner for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VEL = -12;
  const PLAYER_SIZE = 20;
  const SCROLL_SPEED = 4;
  const OBSTACLE_FREQ = 120; // frames

  let frame = 0, score = 0, gameOver = false;

  // Helper: draw background gradient and ground line
  function drawBackground() {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#87ceeb'); // light blue
    sky.addColorStop(1, '#b0e0e6'); // pale turquoise
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // Ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, H - 10, W, 10);
  }

  const player = {
    x: 50,
    y: H - PLAYER_SIZE - 10, // above ground
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    sliding: false,
    jump() { if (this.onGround()) this.vy = JUMP_VEL; },
    slide(val) { this.sliding = val; },
    onGround() { return this.y >= H - this.height - 10; },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y > H - this.height - 10) { this.y = H - this.height - 10; this.vy = 0; }
      // slide reduces height
      this.height = this.sliding ? PLAYER_SIZE / 2 : PLAYER_SIZE;
    },
    draw() {
      // Rounded player with outline
      ctx.fillStyle = '#0ff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(this.x + r, this.y);
      ctx.lineTo(this.x + this.width - r, this.y);
      ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + r);
      ctx.lineTo(this.x + this.width, this.y + this.height - r);
      ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - r, this.y + this.height);
      ctx.lineTo(this.x + r, this.y + this.height);
      ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - r);
      ctx.lineTo(this.x, this.y + r);
      ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  };

  const obstacles = [];
  function spawnObstacle() {
    const types = ['spike', 'gap'];
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === 'spike') {
      const size = 20 + Math.random() * 20;
      obstacles.push({ x: W, y: H - size - 10, w: size, h: size, type: 'spike' });
    } else {
      const gapWidth = 40 + Math.random() * 40;
      obstacles.push({ x: W + gapWidth, y: H, w: gapWidth, h: H, type: 'gap' });
    }
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    if (frame % OBSTACLE_FREQ === 0) spawnObstacle();
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        // Draw triangle spike
        ctx.fillStyle = '#f33';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
      // gaps are invisible
    });
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (o.type === 'spike') {
        if (player.x < o.x + o.w && player.x + player.width > o.x &&
            player.y < o.y + o.h && player.y + player.height > o.y) {
          return true;
        }
      } else if (o.type === 'gap') {
        if (player.x < o.x + o.w && player.x + player.width > o.x && player.onGround()) {
          return true;
        }
      }
    }
    return false;
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 30);
      return;
    }
    drawBackground();
    player.update();
    updateObstacles();
    player.draw();
    drawObstacles();
    if (checkCollision()) gameOver = true;
    score = Math.floor(frame / 10);
    // Score UI
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    frame++;
    requestAnimationFrame(loop);
  }

  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      player.jump();
      playTone(400, 0.1); // jump sound
    }
    if (e.code === 'ArrowDown') player.slide(true);
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') player.slide(false);
  });

  // Play game over sound once
  function playGameOverSound() {
    playTone(150, 0.4);
  }

  // Modify loop to trigger sound on game over
  const originalLoop = loop;
  function loop() {
    if (gameOver) {
      // Ensure sound plays only once
      if (!loop.gameOverSoundPlayed) {
        playGameOverSound();
        loop.gameOverSoundPlayed = true;
      }
    }
    originalLoop();
  }

  loop();
})();
