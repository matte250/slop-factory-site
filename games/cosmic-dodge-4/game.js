// Cosmic Dodge – enhanced graphics with sound
(() => {
  // Audio context and helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Background hum
  let audioStarted = false;
window.addEventListener('click', () => { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } });
window.addEventListener('keydown', () => { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } });
const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30;
  bgOsc.type = 'sine';
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgOsc.start();
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 40,
    speed: 5,
    draw() {
      // gradient ship body
      const grad = ctx.createLinearGradient(
        this.x - this.w / 2,
        this.y,
        this.x + this.w / 2,
        this.y + this.h
      );
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  // Asteroid pool
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 90; // frames
  let speedFactor = 1;
  let score = 0;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const y = -size;
    const speed = (Math.random() * 1.5 + 1) * speedFactor;
    asteroids.push({ x, y, size, speed });
  }

  function update() {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Spawn asteroids
    if (spawnTimer-- <= 0) {
      spawnAsteroid();
      playTone(300, 0.07);
      spawnTimer = spawnInterval;
    }

    // Update asteroids and check collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      const dx = Math.abs(ship.x - (a.x + a.size / 2));
      const dy = Math.abs(ship.y + ship.h / 2 - (a.y + a.size / 2));
      if (dx < ship.w / 2 + a.size / 2 && dy < ship.h / 2 + a.size / 2) {
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // Difficulty scaling
    score += 0.1;
    if (score % 1000 < 0.1) {
      speedFactor += 0.2;
      spawnInterval = Math.max(30, spawnInterval - 5);
    }
  }

  function drawBackground() {
    // space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#000030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    drawBackground();
    ship.draw();
    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
