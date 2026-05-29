// Asteroid Dodge game – targets <canvas id="game"></canvas>
(() => {

  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');

  // Adjust canvas to fill its styled size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Starfield background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#444'; // dim stars for night sky
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function initAudio() {
    if (!audioInitialized) {
      audioCtx.resume();
      audioInitialized = true;
    }
  }

  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      // draw a simple triangular ship
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y); // tip
      ctx.lineTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
    },
  };

  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1500; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const speed = Math.random() * 1 + 1 + score * 0.02; // accelerate with score
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed,
    });
    // light beep for new asteroid
    playTone(300, 0.05);
  }

  function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * (delta / 16);
      // remove off‑screen
      if (a.y - a.size > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision with ship
      if (
        a.x < ship.x + ship.width &&
        a.x + a.size > ship.x &&
        a.y < ship.y + ship.height &&
        a.y + a.size > ship.y
      ) {
        playTone(150, 0.3);
        gameOver = true;
      }
    }
  }

  function drawAsteroids() {
    ctx.fillStyle = '#a55';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`,
      10,
      20);
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // draw night background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();

    if (!gameOver) {
      // spawn
      asteroidTimer += delta;
      if (asteroidTimer > asteroidInterval) {
        asteroidTimer = 0;
        spawnAsteroid();
      }
      ship.update();
      updateAsteroids(delta);
      ship.draw();
      drawAsteroids();
      score += delta / 1000; // seconds
      drawScore();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = '#f88';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      drawScore();
    }
  }

  // input handling
  window.addEventListener('keydown', e => {
    initAudio();
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  requestAnimationFrame(loop);
})();
