// Meteor Dodge – simple canvas game
// Canvas with id='game' is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;

  // Resize canvas to fill its CSS size
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    ctx.scale(DPR, DPR);
    // regenerate stars for new size
    initStars();
  }
  window.addEventListener('resize', resize);
  resize();

  // Ship – simple triangle
  const ship = {
    w: 30,
    h: 20,
    x: 0,
    y: 0,
    speed: 5,
    update() {
      // keep ship inside canvas
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > canvas.width / DPR) this.x = canvas.width / DPR - this.w;
    },
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  // Ensure audio context starts after first user interaction
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('touchstart', resumeAudio, { once: true });

  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

// Position ship at bottom centre
function resetShip() {
  ship.x = (canvas.width / DPR - ship.w) / 2;
  ship.y = canvas.height / DPR - ship.h - 5;
}
resetShip();

// Pre‑generated starfield for smoother background
const stars = [];
function initStars(count = 80) {
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;
  stars.length = 0;
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random() * w, y: Math.random() * h });
  }
}
initStars();

// Particles for explosion effect
const particles = [];
function spawnExplosion(x, y, radius) {
  const count = 20;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30,
      radius: Math.random() * radius * 0.3,
    });
  }
}

  // Input handling – mouse/touch and arrow keys
  let inputX = null;
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    inputX = (e.clientX - rect.left) - ship.w / 2;
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    inputX = (e.touches[0].clientX - rect.left) - ship.w / 2;
  }, { passive: false });

  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Meteors
  const meteors = [];
  let meteorTimer = 0;
  let spawnInterval = 90; // frames
  const gravity = 2;

  function spawnMeteor() {
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (canvas.width / DPR - radius * 2);
    meteors.push({ x, y: -radius, r: radius, speed: gravity + Math.random() });
    // subtle tone for new meteor
    playTone(200 + Math.random() * 200, 'square', 0.05);
  }

  // Particle system update (called each frame)
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // Collision detection
  function collides(m) {
    const shipCenterX = ship.x + ship.w / 2;
    const shipTopY = ship.y;
    // Approximate ship as rectangle for simplicity
    const rx = ship.x, ry = ship.y, rw = ship.w, rh = ship.h;
    const cx = m.x + m.r, cy = m.y + m.r;
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX, dy = cy - nearestY;
    return dx * dx + dy * dy < m.r * m.r;
  }

  let score = 0;
  let gameOver = false;

  function update() {
    // Input → ship movement
    if (inputX !== null) {
      ship.x += (inputX - ship.x) * 0.2; // smooth follow
    }
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.update();

    // Meteors
    if (meteorTimer-- <= 0) {
      spawnMeteor();
      meteorTimer = spawnInterval;
      // speed up over time
      if (spawnInterval > 30) spawnInterval -= 0.5;
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (collides(m)) {
        // explosion effect
        spawnExplosion(m.x + m.r, m.y + m.r, m.r);
        gameOver = true;
        break;
      }
      if (m.y - m.r > canvas.height / DPR) {
        meteors.splice(i, 1);
        score++;
      }
    }
    // Update particles regardless of game over to let explosions finish
    updateParticles();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width / DPR, canvas.height / DPR);
    // background with starfield
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
    // draw pre‑generated stars
    ctx.fillStyle = '#444';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // ship & meteors
    ship.draw();
    // draw meteors with glow
    meteors.forEach(m => {
      // outer glow
      ctx.beginPath();
      ctx.arc(m.x + m.r, m.y + m.r, m.r + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,70,70,0.3)';
      ctx.fill();
      // core
      ctx.beginPath();
      ctx.arc(m.x + m.r, m.y + m.r, m.r, 0, Math.PI * 2);
      ctx.fillStyle = '#f44';
      ctx.fill();
    });
    // particles (explosions)
    ctx.fillStyle = '#ff8';
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,200,0,${p.life / 30})`;
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
      ctx.fillStyle = '#ff6';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / (2 * DPR), canvas.height / (2 * DPR));
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
