// Minimal Canvas Runner game
// Assumes a <canvas id="game"></canvas> exists in the page.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Game parameters
  let speed = 2; // base scroll speed (pixels per frame)
  const speedIncrease = 0.001; // accelerate over time
  const gravity = 0.5;
  const jumpVelocity = -10;

  // Player
  const player = {
    x: 50,
    y: height - 50,
    w: 30,
    h: 30,
    vy: 0,
    onGround: true,
    draw() {
      // Draw player as a rounded green rectangle
      ctx.fillStyle = '#0f0';
      const r = 6; // corner radius
      ctx.beginPath();
      ctx.moveTo(this.x + r, this.y);
      ctx.lineTo(this.x + this.w - r, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + r);
      ctx.lineTo(this.x + this.w, this.y + this.h - r);
      ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - r, this.y + this.h);
      ctx.lineTo(this.x + r, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - r);
      ctx.lineTo(this.x, this.y + r);
      ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.vy += gravity;
      this.y += this.vy;
      if (this.y + this.h >= height) {
        this.y = height - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) { this.vy = jumpVelocity; this.onGround = false; }
    }
  };

  // Obstacles (spikes)
  const obstacles = [];
  const obstacleFreq = 90; // frames between new obstacles
  let obstacleTimer = 0;
  function addObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: width, y: height - size, w: size, h: size });
  }

  // Stars (collectibles)
  const stars = [];
  const starFreq = 150; // frames between stars
  let starTimer = 0;
  function addStar() {
    const size = 15;
    const yPos = height - 150 - Math.random() * 100;
    stars.push({ x: width, y: yPos, w: size, h: size });
  }

  // Score
  let score = 0;
  let highScore = Number(localStorage.getItem('highScore') || 0);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Input
  function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    player.jump();
    playTone(300, 'square', 0.08); // jump sound
  }
  window.addEventListener('keydown', handleInput);
  canvas.addEventListener('mousedown', handleInput);

  // Main loop
  let frame = 0;
  let gameOver = false;
  function loop() {
    if (gameOver) return;
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#66a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Update player
    player.update();
    player.draw();

    // Obstacles
    if (obstacleTimer++ >= obstacleFreq) { addObstacle(); obstacleTimer = 0; }
    obstacles.forEach((obs, i) => {
      obs.x -= speed;
      // Draw spike as a triangle
      ctx.fillStyle = '#f90';
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + obs.h);
      ctx.lineTo(obs.x + obs.w / 2, obs.y);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
      // Collision detection (approximate using bounding box)
      if (obs.x < player.x + player.w && obs.x + obs.w > player.x &&
          obs.y < player.y + player.h && obs.y + obs.h > player.y) {
        playTone(100, 'sawtooth', 0.3); // collision sound
        gameOver = true;
      }
    });
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // Stars
    if (starTimer++ >= starFreq) { addStar(); starTimer = 0; }
    stars.forEach((star, i) => {
      star.x -= speed;
      // Draw star as a glowing circle
      const gradient = ctx.createRadialGradient(
        star.x + star.w / 2,
        star.y + star.h / 2,
        0,
        star.x + star.w / 2,
        star.y + star.h / 2,
        star.w
      );
      gradient.addColorStop(0, '#ff0');
      gradient.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(star.x + star.w / 2, star.y + star.h / 2, star.w, 0, Math.PI * 2);
      ctx.fill();
      if (star.x < player.x + player.w && star.x + star.w > player.x &&
          star.y < player.y + player.h && star.y + star.h > player.y) {
        score += 10;
        stars.splice(i, 1);
      }
    });
    while (stars.length && stars[0].x + stars[0].w < 0) stars.shift();

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 40);

    // Speed increase
    speed += speedIncrease;
    frame++;
    requestAnimationFrame(loop);
  }

  // End game handling
  function end() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', width/2-60, height/2-10);
    ctx.fillText(`Score: ${score}`, width/2-60, height/2+20);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      ctx.fillText('New High Score!', width/2-80, height/2+50);
    }
  }

  // Start loop
  requestAnimationFrame(loop);

  // Detect game over and stop loop
  const checkGameOver = setInterval(() => {
    if (gameOver) {
      clearInterval(checkGameOver);
      end();
    }
  }, 100);
})();
