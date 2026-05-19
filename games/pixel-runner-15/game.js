// Simple endless runner with enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  function playJumpSound() { playBeep(440, 0.15); }
  function playCoinSound() { playBeep(800, 0.1); }
  function playGameOverSound() { playBeep(200, 0.4); }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;
  // Create a simple vertical gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#87CEEB'); // sky
  bgGrad.addColorStop(1, '#fff');


  // Game state
  let running = false;
  let score = 0;
  const speed = 3;

  // Player
  const groundHeight = 20;
  const player = {
    x: 50,
    y: H - 60,
    w: 40,
    h: 40,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    jump() {
      if (this.onGround) {
        this.vy = this.jumpStrength;
        this.onGround = false;
        playJumpSound();
      }
    },
    onGround: true,
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      const groundY = H - groundHeight;
      if (this.y + this.h >= groundY) {
        this.y = groundY - this.h;
        this.vy = 0;
        this.onGround = true;
      }
    },
    draw() {
      // draw a simple pixel‑art character: head and body
      ctx.fillStyle = '#0af';
      // body
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // head (smaller rectangle on top)
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + this.w * 0.25, this.y - this.h * 0.4, this.w * 0.5, this.h * 0.4);
    }
  };

  // Obstacles and coins
  const obstacles = [];
  const coins = [];

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    // position obstacle on ground above groundHeight
    const yPos = H - groundHeight - size;
    obstacles.push({ x: W, y: yPos, w: size, h: size });
  }

  function spawnCoin() {
    const size = 15;
    const y = H - player.h - 80 - Math.random() * 120;
    coins.push({ x: W, y, w: size, h: size });
  }

  let obstacleTimer = 0;
  let coinTimer = 0;

  function updateObjects(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const obj = arr[i];
      obj.x -= speed;
      if (obj.x + obj.w < 0) arr.splice(i, 1);
    }
  }

  function drawRoundedRect(x, y, w, h, r, color) {
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
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawObjects(arr, color) {
    arr.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 5, color));
  }

  function checkCollisions() {
    // player vs obstacles
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

  function collectCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (
        player.x < c.x + c.w &&
        player.x + player.w > c.x &&
        player.y < c.y + c.h &&
        player.y + player.h > c.y
      ) {
        score += 10;
        coins.splice(i, 1);
        playCoinSound();
      }
    }
  }

  function gameOver() {
    running = false;
    playGameOverSound();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', W / 2 - 80, H / 2);
    ctx.fillText(`Score: ${score}`, W / 2 - 70, H / 2 + 40);
  }

  function loop() {
    if (!running) return;
    // draw background gradient
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // spawn obstacles/coins
    if (obstacleTimer <= 0) { spawnObstacle(); obstacleTimer = 120; }
    else obstacleTimer--;
    if (coinTimer <= 0) { spawnCoin(); coinTimer = 180; }
    else coinTimer--;

    updateObjects(obstacles);
    updateObjects(coins);
    player.update();
    collectCoins();

    drawObjects(obstacles, '#b33'); // slightly brighter
    drawObjects(coins, '#ffcc00'); // gold tone
    player.draw();

    // draw ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - groundHeight, W, groundHeight);

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);

    if (checkCollisions()) {
      gameOver();
      return;
    }
    requestAnimationFrame(loop);
  }

  // Input
  window.addEventListener('keydown', e => { if (e.code === 'Space') player.jump(); });
  canvas.addEventListener('pointerdown', () => player.jump());

  // Start the game
  function start() {
    if (running) return;
    // reset state
    obstacles.length = 0;
    coins.length = 0;
    score = 0;
    player.x = 50;
    player.y = H - player.h - 20;
    player.vy = 0;
    player.onGround = true;
    running = true;
    loop();
  }

  // Auto‑start on load; press Space to restart after game over
  start();
  window.addEventListener('keydown', e => { if (!running && e.code === 'Space') start(); });
})();
