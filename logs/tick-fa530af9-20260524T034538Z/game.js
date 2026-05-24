// Game: Solar Flare Escape
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone player
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match its displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5
    });
  }

  function updateStars(delta) {
    for (const s of stars) {
      s.x -= s.speed * speedFactor * 0.5;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  // Player probe
  const player = {
    x: 50,
    y: canvas.height / 2,
    w: 20,
    h: 20,
    speed: 3,
    dx: 0,
    dy: 0,
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside bounds
      if (this.x < 0) this.x = 0;
      if (this.y < 0) this.y = 0;
      if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
      if (this.y + this.h > canvas.height) this.y = canvas.height - this.h;
    },
    draw() {
      // Draw probe as a triangle pointing right
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // Add simple glow
      ctx.strokeStyle = 'rgba(0,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Play movement sound on any direction key press
    const moving = (e.key === 'ArrowLeft' || e.key === 'a' ||
                    e.key === 'ArrowRight' || e.key === 'd' ||
                    e.key === 'ArrowUp' || e.key === 'w' ||
                    e.key === 'ArrowDown' || e.key === 's');
    if (moving) playTone(300, 80);
    // Play movement sound on any direction key press
    const moving = (e.key === 'ArrowLeft' || e.key === 'a' ||
                    e.key === 'ArrowRight' || e.key === 'd' ||
                    e.key === 'ArrowUp' || e.key === 'w' ||
                    e.key === 'ArrowDown' || e.key === 's');
    if (moving) playTone(300, 80);
    keys[e.key] = true;
    updateDirection();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    updateDirection();
  });
  function updateDirection() {
    player.dx = 0;
    player.dy = 0;
    if (keys.ArrowLeft || keys['a']) player.dx = -player.speed;
    if (keys.ArrowRight || keys['d']) player.dx = player.speed;
    if (keys.ArrowUp || keys['w']) player.dy = -player.speed;
    if (keys.ArrowDown || keys['s']) player.dy = player.speed;
  }

  // Obstacles (solar flares, asteroids, debris)
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 1500; // ms
  // Speed factor for difficulty and star movement
let speedFactor = 1;

  function spawnObstacle() {
    const types = [
      {color: '#f90', w: 30, h: 30}, // flare
      {color: '#999', w: 40, h: 40}, // asteroid
      {color: '#555', w: 20, h: 20}  // debris
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const y = Math.random() * (canvas.height - type.h);
    obstacles.push({
      x: canvas.width,
      y,
      w: type.w,
      h: type.h,
      color: type.color,
      speed: 2 * speedFactor + Math.random() * 2
    });
  }

  function updateObstacles(delta) {
    obstacleTimer += delta;
    if (obstacleTimer > obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  // Collision detection (AABB)
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
    // also lose if player leaves vertical bounds (already clamped, so ignore)
    return false;
  }

  // Score handling
  let score = 0;
  let lastTime = performance.now();
  const scoreEl = document.createElement('div');
  scoreEl.style.position = 'absolute';
  scoreEl.style.top = '10px';
  scoreEl.style.left = '10px';
  scoreEl.style.color = '#fff';
  scoreEl.style.font = '16px monospace';
  document.body.appendChild(scoreEl);

  function updateScore(delta) {
    score += delta * 0.01; // increase modestly over time
    const high = parseFloat(localStorage.getItem('highScore') || '0');
    if (score > high) {
      localStorage.setItem('highScore', score.toFixed(0));
    }
    scoreEl.textContent = `Score: ${Math.floor(score)}  High: ${Math.floor(high)}`;
  }

  // Main loop
  function loop(now) {
    // Ensure audio context runs (some browsers require user interaction before playing)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const delta = now - lastTime;
    lastTime = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // increase difficulty gradually
    speedFactor = 1 + score / 5000;
    updateStars(delta);
    drawStars();
    player.update();
    updateObstacles(delta);
    player.draw();
    drawObstacles();
    updateScore(delta);
    if (checkCollision()) {
      cancelAnimationFrame(animId);
      // Play crash sound
      playTone(100, 300);
      // Delay alert to allow sound to play
      setTimeout(() => {
        alert('Game Over! Final score: ' + Math.floor(score));
      }, 350);
      return;
    }
    animId = requestAnimationFrame(loop);
  }
  let animId = requestAnimationFrame(loop);
})();
