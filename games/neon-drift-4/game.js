// Improved Neon Drift graphics
// Assumes an existing <canvas id="game"></canvas> in the page

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  // Background hum
  let bgOsc;
  const startBackground = () => {
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 30;
    gain.gain.value = 0.02;
    bgOsc.connect(gain);
    gain.connect(audioCtx.destination);
    bgOsc.start();
  };
  const stopBackground = () => {
    if (bgOsc) bgOsc.stop();
  };
  // Full‑window canvas
  // Resize canvas to fill window
const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // ----- Starfield -----
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 1.5
    });
  }
  const updateStars = () => {
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
  };

  // ----- Input handling -----
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, w: false, a: false, s: false, d: false };
  const setKey = (e, down) => {
    const k = e.key;
    if (k in keys) keys[k] = down;
  };
  window.addEventListener('keydown', e => setKey(e, true));
  window.addEventListener('keyup', e => setKey(e, false));

  // ----- Game objects -----
  // Ship object with neon glow
const ship = {
    x: canvas.width / 2,
    y: canvas.height * 0.8,
    w: 30,
    h: 40,
    speed: 5,
    draw() {
      ctx.fillStyle = '#00ffff'; // neon cyan
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (keys.ArrowLeft || keys.a) this.x -= this.speed;
      if (keys.ArrowRight || keys.d) this.x += this.speed;
      if (keys.ArrowUp || keys.w) this.y -= this.speed;
      if (keys.ArrowDown || keys.s) this.y += this.speed;
      // keep inside bounds
      this.x = Math.max(this.w / 2, Math.min(canvas.width - this.w / 2, this.x));
      this.y = Math.max(this.h / 2, Math.min(canvas.height - this.h / 2, this.y));
    }
  };

  const obstacles = [];
  const obstacleFreq = 90; // frames between spawns
  let frameCount = 0;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const size = 30 + Math.random() * 40;
    const x = Math.random() * (canvas.width - size) + size / 2;
    obstacles.push({ x, y: -size, size, speed: 3 + Math.random() * 2 });
  };

  const updateObstacles = () => {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // remove off‑screen
      if (o.y - o.size > canvas.height) obstacles.splice(i, 1);
    }
  };

  const drawObstacles = () => {
    ctx.fillStyle = '#ff00ff'; // neon magenta
    obstacles.forEach(o => {
      ctx.fillRect(o.x - o.size / 2, o.y - o.size / 2, o.size, o.size);
    });
  };

  const checkCollision = () => {
    const shipRect = { x: ship.x - ship.w / 2, y: ship.y - ship.h / 2, w: ship.w, h: ship.h };
    for (const o of obstacles) {
      const obRect = { x: o.x - o.size / 2, y: o.y - o.size / 2, w: o.size, h: o.size };
      if (shipRect.x < obRect.x + obRect.w &&
          shipRect.x + shipRect.w > obRect.x &&
          shipRect.y < obRect.y + obRect.h &&
          shipRect.y + shipRect.h > obRect.y) {
        return true;
      }
    }
    return false;
  };

  const drawScore = () => {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 30);
  };

  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
    // background already drawn above
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width/2, canvas.height/2 + 40);
      return;
    }
    // Draw starfield background
// Create a subtle gradient for depth
const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
gradient.addColorStop(0, '#001030');
gradient.addColorStop(1, '#000010');
ctx.fillStyle = gradient;
ctx.fillRect(0,0,canvas.width,canvas.height);
// Draw moving stars
ctx.fillStyle = '#5555ff';
stars.forEach(s => {
  ctx.fillRect(s.x, s.y, 2, 2);
});
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // update
    ship.update();
    if (frameCount % obstacleFreq === 0) spawnObstacle();
    updateObstacles();
    if (checkCollision()) { playTone(200, 0.3); stopBackground(); gameOver = true; }
    score += 0.1; // distance / time based

    // draw
    // play background hum if not started
    if (!bgOsc) startBackground();
    ship.draw();
    drawObstacles();
    drawScore();

    frameCount++;
    requestAnimationFrame(loop);
  };

  // start the game
  requestAnimationFrame(loop);
})();
