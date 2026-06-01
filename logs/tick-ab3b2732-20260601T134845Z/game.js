// Simple Meteor Shatter game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaserSound() { playTone(800, 0.1); }
  function playExplosionSound() { playTone(200, 0.3); }
  function playGameOverSound() { playTone(100, 0.5); }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ----- Game state -----
  const ship = { x: width / 2, y: height - 40, w: 20, h: 30, speed: 4 };
  let meteors = [];
  let lasers = [];
  let particles = [];
  let score = 0;
  let lives = 3;
  let gameOver = false;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
canvas.addEventListener('click', e => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    // fire from ship center
    lasers.push({ x: ship.x, y: ship.y, dx: (mx - ship.x) * 0.1, dy: -5 });
    playLaserSound();
  });

  // ----- Helpers -----
  function spawnMeteor() {
    const size = Math.random() * 20 + 20; // 20-40
    const x = Math.random() * (width - size);
    const y = -size;
    const speed = Math.random() * 1 + 0.5;
    meteors.push({ x, y, size, speed, dx: 0, dy: speed });
  }

  function splitMeteor(m) {
    // explosion particles and sound
    createExplosion(m);
    playExplosionSound();
    // split into smaller meteors
    if (m.size < 15) return;
    const newSize = m.size / 2;
    for (let i = 0; i < 2; i++) {
      meteors.push({
        x: m.x + Math.random() * 5,
        y: m.y + Math.random() * 5,
        size: newSize,
        speed: m.speed * 1.2,
        dx: (Math.random() - 0.5) * 1,
        dy: m.speed,
      });
    }
  }


// Explosion particles
function createExplosion(m) {
  const count = Math.max(5, Math.floor(m.size / 4));
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particles.push({
      x: m.x + m.size / 2,
      y: m.y + m.size / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.random() * 30 + 20,
      color: 'orange',
    });
  }
}



  function rectCircleCollide(rx, ry, rw, rh, cx, cy, cr) {
    // approximate with distance to rect center
    const dx = Math.abs(cx - (rx + rw / 2));
    const dy = Math.abs(cy - (ry + rh / 2));
    if (dx > (rw / 2 + cr) || dy > (rh / 2 + cr)) return false;
    if (dx <= (rw / 2) || dy <= (rh / 2)) return true;
    const cornerDist = (dx - rw / 2) ** 2 + (dy - rh / 2) ** 2;
    return cornerDist <= cr * cr;
  }

  // ----- Game loop -----
  function update() {
    if (gameOver) return;
    // move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // move lasers
    lasers.forEach(l => {
      l.x += l.dx;
      l.y += l.dy;
    });
    lasers = lasers.filter(l => l.y > -10 && l.x > -10 && l.x < width + 10);

    // move meteors
    meteors.forEach(m => {
      m.x += m.dx;
      m.y += m.dy;
    });
    meteors = meteors.filter(m => m.y - m.size < height);

    // update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
    });
    particles = particles.filter(p => p.life > 0);

    // collisions laser vs meteor
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (Math.hypot(l.x - (m.x + m.size / 2), l.y - (m.y + m.size / 2)) < m.size / 2) {
          // hit
          score += 10;
          splitMeteor(m);
          meteors.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }
    }

    // ship vs meteor fragments
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (rectCircleCollide(ship.x, ship.y, ship.w, ship.h, m.x + m.size / 2, m.y + m.size / 2, m.size / 2)) {
        lives--;
        meteors.splice(i, 1);
        if (lives <= 0) {
          gameOver = true;
        }
      }
    }

    // spawn new meteors periodically
    if (Math.random() < 0.02) spawnMeteor();
  }
    if (gameOver) return;
    // move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // move lasers
    lasers.forEach(l => {
      l.x += l.dx;
      l.y += l.dy;
    });
    lasers = lasers.filter(l => l.y > -10 && l.x > -10 && l.x < width + 10);

    // move meteors
    meteors.forEach(m => {
      m.x += m.dx;
      m.y += m.dy;
    });
    meteors = meteors.filter(m => m.y - m.size < height);

    // collisions laser vs meteor
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (Math.hypot(l.x - (m.x + m.size / 2), l.y - (m.y + m.size / 2)) < m.size / 2) {
          // hit
          score += 10;
          splitMeteor(m);
          meteors.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }
    }

    // ship vs meteor fragments
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (rectCircleCollide(ship.x, ship.y, ship.w, ship.h, m.x + m.size / 2, m.y + m.size / 2, m.size / 2)) {
        lives--;
        meteors.splice(i, 1);
        if (lives <= 0) {
          gameOver = true;
        }
      }
    }

    // spawn new meteors periodically
    if (Math.random() < 0.02) spawnMeteor();
  }

  // Pre-generate starfield
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // background stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // meteors with gradient shading
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.1,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // lasers
    ctx.fillStyle = 'red';
    lasers.forEach(l => {
      ctx.fillRect(l.x - 2, l.y - 10, 4, 10);
    });
    // particles (explosions)
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = 'yellow';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the loop
  requestAnimationFrame(loop);
})();
