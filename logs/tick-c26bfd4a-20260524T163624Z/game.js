// Simple Meteor Dodge game with enhanced graphics
// Assumes a <canvas id="game"></canvas> exists in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Sound effects
  const collisionSound = new Audio('https://assets.pixilart.com/sounds/bleep.wav'); // fallback beep
  const meteorSound = new Audio('https://assets.pixilart.com/sounds/laser.wav');
  // Background music (optional, looped)
  const bgMusic = new Audio('https://assets.pixilart.com/sounds/loop.wav');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  // Start background music after first user interaction
  let musicStarted = false;
  function startMusic() {
    if (!musicStarted) {
      bgMusic.play().catch(() => {});
      musicStarted = true;
    }
  }
   // Starfield data
   const stars = [];
   function initStars() {
     stars.length = 0;
     const count = Math.round(canvas.width * canvas.height / 8000); // density
     for (let i = 0; i < count; i++) {
       stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
     }
   }
   // Resize canvas to match its displayed size
   function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initStars();
  }
  resize();
  window.addEventListener('resize', resize);

  // Player ship
  const ship = {
  // Draw ship as a triangle
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x + this.w / 2, this.y);
    ctx.lineTo(this.x, this.y + this.h);
    ctx.lineTo(this.x + this.w, this.y + this.h);
    ctx.closePath();
    ctx.fill();
  },
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 6,
    color: '#0ff',
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      // Clamp within canvas
      this.x = Math.max(0, Math.min(this.x, canvas.width - this.w));
    },

  };

  // Input handling
  window.addEventListener('keydown', (e) => {
    startMusic();
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') ship.moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') ship.moveRight = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') ship.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') ship.moveRight = false;
  });

  // Meteor management
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  function spawnMeteor() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 3;
    meteors.push({ x, y: -radius, radius, speed });
    meteorSound.currentTime = 0;
    meteorSound.play().catch(() => {});
  }

  // Collision detection
  function collides(meteor) {
    // Simple AABB vs circle check
    const cx = meteor.x;
    const cy = meteor.y;
    const r = meteor.radius;
    const nearestX = Math.max(ship.x, Math.min(cx, ship.x + ship.w));
    const nearestY = Math.max(ship.y, Math.min(cy, ship.y + ship.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < r * r;
  }

  // Score
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  function update(delta) {
    if (gameOver) return;
    ship.update();
    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (m.y - m.radius > canvas.height) {
        meteors.splice(i, 1);
        continue;
      }
      if (collides(m)) {
        gameOver = true;
        break;
      }
    }
    // Spawn new meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }
    // Update score based on elapsed time
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // Draw ship
    ship.draw();
    // Draw meteors
    ctx.fillStyle = '#f44';
    for (const m of meteors) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(ts) {
    const delta = ts - lastTime;
    lastTime = ts;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
