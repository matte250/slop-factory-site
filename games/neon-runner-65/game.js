// Game: Neon Runner
// Assumes an existing <canvas id="game"></canvas> in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('click', resumeAudio, { once: true });

  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;
  // generate static starfield
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT });
  }

  // Player ship with trail effect
  const ship = {
    x: 80,
    y: HEIGHT / 2,
    w: 30,
    h: 20,
    dy: 0,
    speed: 4,
    draw() {
      // neon glow effect
      ctx.save();
      ctx.fillStyle = '#0ff';
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      this.y += this.dy;
      // keep within bounds
      if (this.y < this.h / 2) this.y = this.h / 2;
      if (this.y > HEIGHT - this.h / 2) this.y = HEIGHT - this.h / 2;
    }
  };

  // Obstacles (pairs with a gap)
  const obstacles = [];
  const OBSTACLE_SPEED = 3;
  const GAP_HEIGHT = 120;
  const OBSTACLE_INTERVAL = 1500; // ms
  let lastObstacle = 0;

  function addObstacle() {
    const gapY = Math.random() * (HEIGHT - GAP_HEIGHT - 40) + 20;
    const thickness = 20;
    obstacles.push({
      x: WIDTH,
      w: thickness,
      gapY,
      passed: false,
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Game state
  let score = 0;
  let health = 3;
  let gameOver = false;

  function update(dt) {
    // ship movement
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    else if (keys['ArrowDown']) ship.dy = ship.speed;
    else ship.dy = 0;
    ship.update();

    // obstacles
    obstacles.forEach(o => {
      o.x -= OBSTACLE_SPEED;
    });
    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // collision detection
    obstacles.forEach(o => {
      const inXRange = ship.x > o.x && ship.x < o.x + o.w;
      const aboveGap = ship.y - ship.h / 2 < o.gapY;
      const belowGap = ship.y + ship.h / 2 > o.gapY + GAP_HEIGHT;
      if (inXRange && (aboveGap || belowGap)) {
        // hit sound
        playTone(200, 0.2);
        health--;
        // push obstacle beyond ship to avoid repeated hits
        o.x = -o.w;
      } else if (!o.passed && o.x + o.w < ship.x) {
        o.passed = true;
        score += 10;
        // score sound
        playTone(800, 0.1);
      }
    });

    if (health <= 0) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // background gradient with neon effect
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // add subtle starfield
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3;
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    // obstacles
    // draw neon obstacles with glow
    obstacles.forEach(o => {
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#a0a');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      // top block
      ctx.fillRect(o.x, 0, o.w, o.gapY);
      // bottom block
      ctx.fillRect(o.x, o.gapY + GAP_HEIGHT, o.w, HEIGHT - (o.gapY + GAP_HEIGHT));
      ctx.restore();
    });

    // ship
    ship.draw();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${health}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      if (timestamp - lastObstacle > OBSTACLE_INTERVAL) {
        addObstacle();
        lastObstacle = timestamp;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
