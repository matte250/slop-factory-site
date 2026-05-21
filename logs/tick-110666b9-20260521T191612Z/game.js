// Simple endless runner for canvas with id="game"
// Player jumps on click/tap, avoids incoming obstacles. Enhanced graphics with gradient background, ground, simple player sprite, clouds, and colored obstacles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Background layers (parallax clouds)
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * width,
      y: 20 + Math.random() * 60,
      radius: 20 + Math.random() * 30,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  function drawBackground() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#87ceeb'); // light blue
    grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      c.x -= c.speed;
      if (c.x + c.radius < 0) {
        c.x = width + c.radius;
        c.y = 20 + Math.random() * 60;
        c.radius = 20 + Math.random() * 30;
      }
    }
    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - 30, width, 30);
  }

  // Player
  const player = {
    x: 50,
    y: height - 60,
    width: 30,
    height: 30,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.5,
    onGround: true,
    draw() {
      // simple sprite: orange body with white eye
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, 4, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      const groundY = height - 30 - this.height; // ground height 30
      if (this.y >= groundY) {
        this.y = groundY;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = this.jumpStrength;
        this.onGround = false;
      }
    },
  };

  // Obstacles
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({
      x: width,
      y: height - 30 - size, // sit on ground
      width: size,
      height: size,
      speed: 4 + Math.random() * 2,
      color: `hsl(${Math.random() * 360}, 50%, 40%)`,
    });
  }

  function updateObstacles() {
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        // Game over overlay
        cancelAnimationFrame(frameId);
        // play collision sound
        playBeep(150, 0.4);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', width / 2 - 80, height / 2);
        return true;
      }
    }
    return false;
  }

  // Input
  canvas.addEventListener('mousedown', () => {
    audioCtx.resume(); // ensure context is running
    player.jump();
    playBeep(300, 0.1); // jump sound
  });
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    audioCtx.resume();
    player.jump();
    playBeep(300, 0.1);
  }, { passive: false });

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Score
  let score = 0;
  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  // Main loop
  let frameId;
  function loop() {
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    player.update();
    updateObstacles();
    player.draw();
    drawObstacles();
    drawScore();
    if (!checkCollision()) {
      score += 0.1;
      frameId = requestAnimationFrame(loop);
    }
  }

  loop();
})();
