// Simple endless side‑scroll runner based on IDEA.md
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match CSS or fallback
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;
  // Starfield for parallax background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, r: Math.random() * 1.5 + 0.5 });
  }
  // Audio context for simple SFX
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust() { playTone(300, 0.1); }
  function playCrash() { playTone(100, 0.3); }
  function playScore() { playTone(600, 0.05); }

  // physics constants
  const GRAVITY = 0.6; // px/frame^2
  const THRUST = -12;   // immediate upward velocity on press
  const OBSTACLE_SPEED = 4; // px/frame
  const SPAWN_INTERVAL = 1500; // ms

  let lastTime = 0;
  let lastSpawn = 0;
  let score = 0;
  let prevScore = 0;
  let running = true;
  let thrusting = false;

  const player = {
    x: 80,
    y: HEIGHT / 2,
    w: 30,
    h: 20,
    vy: 0,
    draw() {
      // draw ship as a simple triangle
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (thrusting) this.vy = THRUST;
      this.vy += GRAVITY;
      this.y += this.vy;
      // keep within top bounds
      if (this.y < 0) this.y = 0;
    }
  };

  const obstacles = [];
  function spawnObstacle() {
    const type = Math.random();
    const h = 30 + Math.random() * 50;
    const w = 20 + Math.random() * 30;
    const y = Math.random() * (HEIGHT - h);
    // simple gradient obstacle for visual flair
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#f44');
    grad.addColorStop(1, '#800');
    obstacles.push({ x: WIDTH, y, w, h, draw() { ctx.fillStyle = grad; ctx.fillRect(this.x, this.y, this.w, this.h); } });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    player.update();
    // obstacles move left
    obstacles.forEach(o => o.x -= OBSTACLE_SPEED);
    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // collision detection
    for (const o of obstacles) {
      if (rectIntersect(player, o)) {
        if (!crashPlayed) { playCrash(); crashPlayed = true; }
        running = false;
        break;
      }
    }
    // lose if falls off bottom
    if (player.y + player.h > HEIGHT) {
      if (!crashPlayed) { playCrash(); crashPlayed = true; }
      running = false;
    }
    // score based on time survived
    score += dt;
    // optional score tick sound when crossing each 1000 points
    if (Math.floor(score/1000) > Math.floor(prevScore/1000)) { playScore(); }
    prevScore = score;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // draw stars (parallax)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.x -= 0.5; // slow leftward motion
      if (s.x < 0) s.x = WIDTH;
    }
    player.draw();
    obstacles.forEach(o => o.draw());
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      if (timestamp - lastSpawn > SPAWN_INTERVAL) { spawnObstacle(); lastSpawn = timestamp; }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  // input handling – click or touch press
  let crashPlayed = false;
  const setThrust = (state) => {
    if (state && !thrusting) {
      // start thrust
      playThrust();
    }
    thrusting = state;
    // resume audio context on first interaction
    if (state) audioCtx.resume();
  };
  canvas.addEventListener('mousedown', () => setThrust(true));
  canvas.addEventListener('mouseup', () => setThrust(false));
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); setThrust(true); }, { passive: false });
  canvas.addEventListener('touchend', () => setThrust(false));

  requestAnimationFrame(loop);
})();
