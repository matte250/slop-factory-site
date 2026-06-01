// Cosmic Dodger – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Fit canvas to displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // ---------- Starfield background ----------
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#222'; // dark night sky
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ---------- Ship ----------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 20,
    height: 30,
    speed: 5,
    draw() {
      // gradient for a simple metallic look
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#00f');
      grad.addColorStop(1, '#33aaff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      // optional stroke for sharper shape
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    update() {
      if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
      if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
      // keep inside canvas
      this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
    },
  };

  // ---------- Asteroids ----------
  const asteroids = [];
  let frame = 0;
  let score = 0;
  const keys = {};

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const hue = Math.floor(Math.random() * 40 + 20); // rocky colors
    asteroids.push({
      x: Math.random() * (canvas.width - size) + size / 2,
      y: -size,
      radius: size / 2,
      speed: 2 + Math.random() * 2 + score / 5000,
      hue,
    });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // recycle off‑screen asteroids
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // simple collision detection (circle‑triangle proxy)
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - ship.y);
      if (dx < a.radius + ship.width / 2 && dy < a.radius + ship.height) {
        // ---- Game Over ----
        playExplosion(); cancelAnimationFrame(animId);
        ctx.fillStyle = '#ff4444';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 60);
        return;
      }
    }
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      ctx.fillStyle = `hsl(${a.hue}, 30%, 50%)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ---------- UI ----------
  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
  }

  function loop() {
    drawStars(); // background first
    ship.update();
    ship.draw();
    if (frame % 60 === 0) spawnAsteroid(); // ~1 per second
    updateAsteroids();
    drawAsteroids();
    drawScore();
    score += 0.1;
    frame++;
    animId = requestAnimationFrame(loop);
  }

  // ---------- Audio ----------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }

  function playBoost() { playTone(600, 0.1); }
  function playExplosion() { playTone(150, 0.5); }

  // ---------- Input ----------
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') playBoost();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // modify collision sound
  // (in updateAsteroids collision block, replace cancelAnimationFrame line with sound)

  let animId = requestAnimationFrame(loop);
})();
