// Simple endless runner with improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  // generate starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5
  }));
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  };

  // Player ship with gradient
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 30,
    color: '#0ff',
    update(posX) {
      this.x = Math.max(this.w / 2, Math.min(width - this.w / 2, posX));
    },
    draw() {
      // ship gradient fill
      const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y - this.h / 2, this.x + this.w / 2, this.y + this.h / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#00a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames
  const asteroidSpeed = 2;

  // Input handling
  let pointerX = ship.x;
  const setPointer = (e) => {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    pointerX = clientX - rect.left;
  };
  canvas.addEventListener('mousemove', setPointer);
  canvas.addEventListener('touchmove', setPointer, { passive: true });

  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size) + size / 2;
    asteroids.push({ x, y: -size, size, speed: asteroidSpeed + Math.random() });
  }

  function update() {
    if (gameOver) return;
    // Update ship position
    ship.update(pointerX);
    // Move stars for scrolling effect
    for (const s of stars) {
      s.y += 0.3;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // Spawn asteroids
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidInterval;
    }
    asteroidTimer--;
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off-screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - ship.y);
      if (dx < (a.size + ship.w) / 2 && dy < (a.size + ship.h) / 2) {
        // collision sound
        playTone(200, 0.2);
        gameOver = true;
        break;
      }
    }
    // Score
    score++;
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship
    ship.draw();
    // Draw asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size / 2);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
