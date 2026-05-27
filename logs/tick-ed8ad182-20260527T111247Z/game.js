// Asteroid Dodge game – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  // Full‑size canvas
  canvas.width = canvas.clientWidth || window.innerWidth;
  canvas.height = canvas.clientHeight || window.innerHeight;
  const { width, height } = canvas;

  // Starfield background
  const stars = [];
  const STAR_COUNT = 150;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }
  function updateStars() {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Player ship
  const player = {
  // ... existing player definition unchanged
};

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
    x: width / 2,
    y: height / 2,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
    draw() {
    // glowing ship effect
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    const half = this.size/2;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    // triangle pointing up
    ctx.moveTo(this.x, this.y - half);
    ctx.lineTo(this.x - half, this.y + half);
    ctx.lineTo(this.x + half, this.y + half);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.restore();
    ctx.strokeStyle = '#0bb';
    ctx.stroke();
  },
    update() { this.x = Math.max(this.size/2, Math.min(width - this.size/2, this.x + this.dx)); this.y = Math.max(this.size/2, Math.min(height - this.size/2, this.y + this.dy)); }
  };

  // Input handling (WASD / arrows)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true) && updateDirection());
  window.addEventListener('keyup', e => (keys[e.key] = false) && updateDirection());
  function updateDirection() {
  // Play movement sound on any direction change
  if (!audioCtx) return; // safety
  const any = keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d'] || keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'];
  if (any) beep(440, 50);
    player.dx = 0; player.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
    if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
  }

  // Asteroids
  const asteroids = [];
  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const size = 15 + Math.random() * 25;
    const speed = 1 + Math.random() * 2;
    if (edge === 0) { y = -size; x = Math.random() * width; vx = (Math.random() - 0.5) * speed; vy = speed; }
    else if (edge === 1) { x = width + size; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; }
    else if (edge === 2) { y = height + size; x = Math.random() * width; vx = (Math.random() - 0.5) * speed; vy = -speed; }
    else { x = -size; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; }
    asteroids.push({
      x,
      y,
      vx,
      vy,
      size,
      draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, this.size * 0.2, this.x, this.y, this.size);
        grad.addColorStop(0, '#ff8');
        grad.addColorStop(1, '#f44');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#400';
        ctx.stroke();
      }
    });
  }

  // Collision detection (circle‑rect approximation)
  function collides(a, b) {
    const distX = Math.abs(b.x - a.x);
    const distY = Math.abs(b.y - a.y);
    if (distX > (a.size/2 + b.size) || distY > (a.size/2 + b.size)) return false;
    return true;
  }

  let lastTime = 0, score = 0, gameOver = false, spawnTimer = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2 - 20);
      ctx.fillText(`Score: ${Math.floor(score/1000)}s`, width/2, height/2 + 20);
      return;
    }
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,width,height);
    // Update and draw starfield background
    updateStars();
    drawStars();
    // Update player
    player.update();
    player.draw();
    // Spawn asteroids every 1s
    spawnTimer += delta;
    if (spawnTimer > 1000) { spawnAsteroid(); spawnTimer = 0; }
    // Update asteroids
    for (let i = asteroids.length -1; i >=0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      a.draw();
      // Remove off‑screen
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) asteroids.splice(i,1);
      else if (collides(player, a)) { gameOver = true; }
    }
    // Score based on time survived
    score += delta;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score/1000)}s`, 10, 20);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
