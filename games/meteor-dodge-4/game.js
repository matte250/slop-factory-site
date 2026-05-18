// Simple canvas game targeting <canvas id="game"></canvas>
// Player moves with arrow keys and collects falling circles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Hi‑DPI support
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 800;
  const height = canvas.clientHeight || 600;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  // Set logical size for drawing
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // Audio setup (Web Audio API)
  let audioCtx;
  function initAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playCollect(){
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  }

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    w: 50,
    h: 10,
    speed: 5,
    dx: 0,
    draw() {
      // player paddle with gradient and rounded corners
      const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y, this.x + this.w / 2, this.y);
      grad.addColorStop(0, '#0099ff');
      grad.addColorStop(1, '#0066cc');
      ctx.fillStyle = grad;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(this.x - this.w / 2 + radius, this.y - this.h / 2);
      ctx.lineTo(this.x + this.w / 2 - radius, this.y - this.h / 2);
      ctx.quadraticCurveTo(this.x + this.w / 2, this.y - this.h / 2, this.x + this.w / 2, this.y - this.h / 2 + radius);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2 - radius);
      ctx.quadraticCurveTo(this.x + this.w / 2, this.y + this.h / 2, this.x + this.w / 2 - radius, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w / 2 + radius, this.y + this.h / 2);
      ctx.quadraticCurveTo(this.x - this.w / 2, this.y + this.h / 2, this.x - this.w / 2, this.y + this.h / 2 - radius);
      ctx.lineTo(this.x - this.w / 2, this.y - this.h / 2 + radius);
      ctx.quadraticCurveTo(this.x - 
        this.w / 2, this.y - this.h / 2, this.x - this.w / 2 + radius, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      // keep inside canvas
      if (this.x - this.w / 2 < 0) this.x = this.w / 2;
      if (this.x + this.w / 2 > canvas.width) this.x = canvas.width - this.w / 2;
    },
  };

  let score = 0;
const circles = [];
  function spawnCircle() {
    const radius = 12;
    circles.push({
      x: Math.random() * (canvas.width - radius * 2) + radius,
      y: -radius,
      r: radius,
      dy: 2 + Math.random() * 3,
    });
  }
  let spawnTimer = 0;

  function updateCircles() {
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += c.dy;
      // collision with player
      if (
        c.y + c.r >= player.y - player.h / 2 &&
        c.x > player.x - player.w / 2 &&
        c.x < player.x + player.w / 2
      ) {
        circles.splice(i, 1); // remove collected
        score++;
        playCollect();
        continue;
      }
      // remove off-screen
      if (c.y - c.r > canvas.height) circles.splice(i, 1);
    }
  }

  function drawCircles() {
    for (const c of circles) {
      const grad = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      grad.addColorStop(0, '#ff8866');
      grad.addColorStop(1, '#ff2200');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      // subtle outline
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function clear() {
    // draw a subtle vertical gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#001d3d');
    bg.addColorStop(1, '#003566');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawScore() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
  }

function gameLoop() {
    clear();
    player.update();
    player.draw();
    updateCircles();
    drawCircles();
    drawScore();
    // spawn logic
    spawnTimer++;
    if (spawnTimer > 60) { // roughly one per second at 60fps
      spawnCircle();
      spawnTimer = 0;
    }
    requestAnimationFrame(gameLoop);
  }

  // Input handling
  document.addEventListener('keydown', (e) => {
    initAudio();
    if (e.key === 'ArrowLeft') player.dx = -player.speed;
    else if (e.key === 'ArrowRight') player.dx = player.speed;
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') player.dx = 0;
  });

  // start the loop
  requestAnimationFrame(gameLoop);
})();
