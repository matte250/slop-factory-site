// Asteroid Dodge game – enhanced graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  // ----- graphics setup -----
  // starfield background
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function updateStars(delta) {
    for (const s of stars) {
      s.y += s.speed * delta * 0.05; // scale speed
      if (s.y > canvas.height) {
        s.y = -s.radius;
        s.x = Math.random() * canvas.width;
      }
    }
  }
  function drawBackground() {
    // space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // --------------------------

  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // ----- audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playSpawnSound() {
    playTone(200, 0.1);
  }
  function playCollisionSound() {
    // descending pitch explosion
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  // --------------------------

  // ----- configuration -----
  const shipWidth = 40;
  const shipHeight = 20;
  const shipSpeed = 5;
  const asteroidSize = 30;
  const asteroidMinSpeed = 2;
  const asteroidMaxSpeed = 5;
  const spawnInterval = 1000; // ms
  // --------------------------

  const ship = {
    x: canvas.width / 2 - shipWidth / 2,
    y: canvas.height - shipHeight - 10,
    width: shipWidth,
    height: shipHeight,
    dx: 0,
    draw() {
      // ship as pointed triangle
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      // keep inside canvas
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    },
  };

  const asteroids = [];

  function spawnAsteroid() {
    playSpawnSound();
    const x = Math.random() * (canvas.width - asteroidSize);
    const speed = asteroidMinSpeed + Math.random() * (asteroidMaxSpeed - asteroidMinSpeed);
    asteroids.push({ x, y: -asteroidSize, size: asteroidSize, speed });
  }

  function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > canvas.height) {
        asteroids.splice(i, 1);
      }
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const gradient = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      gradient.addColorStop(0, '#aaa');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.width > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.height > a.y
      ) {
        return true;
      }
    }
    return false;
  }

  let lastTime = performance.now();
  let lastSpawn = performance.now();
  let running = true;
  let score = 0;

  function loop(now) {
    // update moving background stars
    updateStars(now - lastTime);
    const delta = now - lastTime;
    lastTime = now;
    if (!running) {
      // show final score
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Game Over – Score: ${Math.floor(score / 1000)}s`, canvas.width / 2, canvas.height / 2);
      return;
    }

    // spawn asteroids
    if (now - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }

    // update
    ship.update();
    updateAsteroids(delta);
    if (checkCollision()) {
      playCollisionSound();
      running = false;
    }

    // draw
    // draw moving starfield background
    drawBackground();
    ship.draw();
    drawAsteroids();

    // score – time survived in ms
    score += delta;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score / 1000)}s`, 10, 20);

    requestAnimationFrame(loop);
  }

  // input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.dx = -shipSpeed;
    if (e.key === 'ArrowRight') ship.dx = shipSpeed;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ship.dx = 0;
  });

  // start loop
  requestAnimationFrame(loop);
})();
