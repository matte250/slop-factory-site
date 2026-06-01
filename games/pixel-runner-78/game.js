// Minimal endless runner for <canvas id="game"></canvas>
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const playJumpSound = () => playTone(300, 0.1);
  const playCollisionSound = () => playTone(100, 0.3);

  // game state
  let score = 0;
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SPEED = 4; // horizontal scroll speed (world moves left)

  const player = {
    x: 50,
    y: H - 30, // ground level
    w: 20,
    h: 20,
    vy: 0,
    onGround: true,
    draw() {
      // draw a simple pixel‑style character as a circle with a small shadow
      const radius = this.w / 2;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(this.x + radius + 2, this.y + radius + 2, radius, 0, Math.PI * 2);
      ctx.fill();
      // main body
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(this.x + radius, this.y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= H) {
        this.y = H - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
  };

  // obstacles: simple spikes (triangles) and blocks (rectangles)
  const obstacles = [];
  const OBSTACLE_SPACING = 300; // distance between spawns
  let lastObstacleX = W;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'block';
    const x = lastObstacleX + OBSTACLE_SPACING + Math.random() * 200;
    if (type === 'spike') {
      const size = 20 + Math.random() * 10;
      obstacles.push({type, x, y: H - size, w: size, h: size});
    } else {
      const w = 30 + Math.random() * 20;
      const h = 30 + Math.random() * 20;
      obstacles.push({type, x, y: H - h, w, h});
    }
    lastObstacleX = x;
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= PLAYER_SPEED; // world scrolls left
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn new obstacles when needed
    if (lastObstacleX < W + OBSTACLE_SPACING) spawnObstacle();
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        // red spike with black outline
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // gray block with dark border
        ctx.fillStyle = '#777';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      }
    });
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

  function gameOver() {
    // play collision sound
    playCollisionSound();
    cancelAnimationFrame(animId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over – Score: ' + Math.floor(score), W / 2, H / 2);
  }

  // starfield for background
const stars = [];
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * (H - 30), // avoid ground area
      r: Math.random() * 1.5 + 0.5,
      speed: 0.2 + Math.random() * 0.3,
    });
  }
}
function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    s.x -= s.speed; // parallax movement
    if (s.x < 0) s.x = W;
  });
}
function drawBackground() {
    // sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#87CEEB'); // light blue top
    grad.addColorStop(1, '#FFF'); // white near ground
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // stars (draw over gradient)
    drawStars();
    // ground
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - groundHeight, W, groundHeight);
  }

function loop() {
    // draw background first
    drawBackground();
    // clear only the area above ground (background already covers whole)
    // player & obstacles are drawn over it
    player.update();
    updateObstacles();
    if (checkCollision()) return gameOver();
    player.draw();
    drawObstacles();
    // score based on distance travelled
    score += PLAYER_SPEED * 0.1;
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    animId = requestAnimationFrame(loop);
  }

  // input – tap / click to jump
  canvas.addEventListener('pointerdown', () => {
    // resume audio context on first interaction if needed
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    }
  });

  // start
  initStars();
  spawnObstacle();
  let animId = requestAnimationFrame(loop);
})();
