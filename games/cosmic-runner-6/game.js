// Minimal infinite runner based on IDEA.md
// Canvas must have id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const ship = {
    w: 30,
    h: 20,
    x: width / 2,
    y: height - 60,
    speed: 5,
    vy: 0,
    gravity: 0.4,
    boost: -8,
    draw() {
      // ship body gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#006');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // thrust flame when boosting upward
      if (this.vy < 0) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.h);
        ctx.lineTo(this.x - this.w / 4, this.y + this.h + 10);
        ctx.lineTo(this.x + this.w / 4, this.y + this.h + 10);
        ctx.closePath();
        ctx.fill();
      }
    },
    update() {
      // horizontal movement handled via input flags
      this.y += this.vy;
      this.vy += this.gravity;
      // keep ship within bounds
      if (this.y > height - 60) this.y = height - 60, this.vy = 0;
      if (this.y < 0) this.y = 0, this.vy = 0;
    }
  };

  const asteroids = [];
  const astRadius = 15;
  // starfield for parallax effect
  const stars = [];
  const starCount = 80;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.2 + Math.random() * 0.4,
        size: Math.random() * 1.5
      });
    }
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
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let running = true;
  const keys = { ArrowLeft: false, ArrowRight: false, Space: false };

  function spawnAsteroid() {
    const x = Math.random() * (width - astRadius * 2) + astRadius;
    const speed = 2 + Math.random() * 2 + score / 1000; // increase with score
    const rot = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.04; // small rotation per frame
    asteroids.push({ x, y: -astRadius, r: astRadius, speed, rot, rotSpeed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.rotSpeed) a.rot += a.rotSpeed;
      if (a.y - a.r > height) {
        asteroids.splice(i, 1);
        score += 10;
      }
    }
  }

  function drawBackground() {
    // dark space background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    // moving starfield for parallax effect
    updateStars();
    drawStars();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot || 0);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - (ship.y + ship.h / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) return true;
    }
    return false;
  }

  function reset() {
    ship.x = width / 2;
    ship.y = height - 60;
    ship.vy = 0;
    asteroids.length = 0;
    spawnTimer = 0;
    score = 0;
    running = true;
    loop();
  }

  function loop() {
    if (!running) return;
    drawBackground();
    // input
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));
    if (keys.Space && ship.vy === 0) ship.vy = ship.boost;

    ship.update();
    ship.draw();

    if (spawnTimer-- <= 0) { spawnAsteroid(); spawnTimer = spawnInterval; }
    updateAsteroids();
    drawAsteroids();

if (checkCollision()) {
        // collision sound
        playBeep(200, 0.3);
        running = false;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2 - 20);
        ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
        ctx.fillText('Click to restart', width / 2, height / 2 + 60);
        canvas.addEventListener('click', function handler() {
          canvas.removeEventListener('click', handler);
          reset();
        });
        return;
      }

    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(loop);
  }

  // key handling
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space') {
      keys.Space = true;
      // boost sound
      playBeep(500, 0.08);
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
    if (e.code === 'Space') keys.Space = false;
  });

  // start
  initStars();
  loop();
})();
