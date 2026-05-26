// Neon Runner – simple endless runner
// Canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Draw neon‑styled background
  function drawBackground() {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#00102b');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // subtle star field
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height * 0.5;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // Game settings
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPEED = 4;
  const OBSTACLE_FREQ = 1500; // ms
  const LUMEN_FREQ = 2000; // ms

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let musicStarted = false;
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }
  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    setInterval(() => playTone(200, 0.1), 500);
  }
  function playJump() { playTone(400, 0.2); }
  function playCollect() { playTone(800, 0.15); }
  function playGameOver() { playTone(100, 0.5); }

  // Player (glowing orb)
  const player = {
    x: 80,
    y: height - 60,
    radius: 20,
    vy: 0,
    onGround: true,
    draw() {
      // neon orb with outer glow
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0033ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.radius >= height - 40) { // ground line
        this.y = height - 40 - this.radius;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    }
  };

  // Obstacle (spike)
  class Obstacle {
    constructor() {
      this.width = 30;
      this.height = 50;
      this.x = width;
      this.y = height - 40 - this.height;
    }
    draw() {
      // neon spike with glow
      ctx.save();
      ctx.shadowColor = '#ff00aa';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff0066';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    update() {
      this.x -= SPEED;
    }
  }

  // Lumen (collectible)
  class Lumen {
    constructor() {
      this.radius = 8;
      this.x = width;
      this.y = height - 80 - Math.random() * 100;
    }
    draw() {
      // neon lumen with soft glow
      ctx.save();
      ctx.shadowColor = '#ffff33';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    update() {
      this.x -= SPEED;
    }
  }

  let obstacles = [];
  let lumens = [];
  let score = 0;
  let lastObstacle = 0;
  let lastLumen = 0;
  let gameOver = false;

  function spawnObstacle() {
    obstacles.push(new Obstacle());
  }
  function spawnLumen() {
    lumens.push(new Lumen());
  }

  function handleInput() {
    // start background music on first interaction
    startMusic();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJump();
    }
  }

  canvas.addEventListener('pointerdown', handleInput);

  function checkCollisions() {
    // obstacle collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (
        player.x + player.radius > o.x &&
        player.x - player.radius < o.x + o.width &&
        player.y + player.radius > o.y
      ) {
        gameOver = true;
        return;
      }
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
    // lumen collection
    for (let i = lumens.length - 1; i >= 0; i--) {
      const l = lumens[i];
      const dx = player.x - l.x;
      const dy = player.y - l.y;
      const dist = Math.hypot(dx, dy);
        if (dist < player.radius + l.radius) {
          score++;
          lumens.splice(i, 1);
          playCollect();
        } else if (l.x + l.radius < 0) {
          lumens.splice(i, 1);
        }
    }
  }

  function drawGround() {
    // neon glowing ground bar
    const grad = ctx.createLinearGradient(0, height - 40, 0, height);
    grad.addColorStop(0, '#00ffcc');
    grad.addColorStop(1, '#004433');
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - 40, width, 40);
    // subtle inner glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(0,255,200,0.2)';
    ctx.fillRect(0, height - 38, width, 4);
    ctx.restore();
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
  }

  function gameLoop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
      return;
    }
    // draw neon background and ground
    drawBackground();
    drawGround();
    // spawn obstacles/lumens based on time intervals
    if (timestamp - lastObstacle > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacle = timestamp;
    }
    if (timestamp - lastLumen > LUMEN_FREQ) {
      spawnLumen();
      lastLumen = timestamp;
    }
    // update and draw
    obstacles.forEach(o => { o.update(); o.draw(); });
    lumens.forEach(l => { l.update(); l.draw(); });
    player.update();
    player.draw();
    drawScore();
    checkCollisions();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
