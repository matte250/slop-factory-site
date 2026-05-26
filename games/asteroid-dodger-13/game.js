// Asteroid Dodger - simple canvas game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback to 800x600 if not set via CSS)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5
    });
  }

  function drawStars() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Update stars for scrolling effect
  function updateStars() {
    stars.forEach(s => {
      s.y += 0.5; // slow downward motion
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
  }

  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // draw ship as a simple triangle
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      // keep within bounds
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }
  };

  const asteroids = [];
  const asteroidSize = 30;
  const asteroidSpeed = 2;
  let frames = 0;
  let gameOver = false;

  function spawnAsteroid() {
    // sound for new asteroid
    playBeep(150, 0.08);
    const x = Math.random() * (canvas.width - asteroidSize);
    asteroids.push({ x, y: -asteroidSize, size: asteroidSize });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += asteroidSpeed;
      // remove if off screen
      if (a.y > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision detection (simple AABB)
        if (
          a.x < ship.x + ship.width &&
          a.x + a.size > ship.x &&
          a.y < ship.y + ship.height &&
          a.y + a.size > ship.y
        ) {
          // collision sound
          playBeep(300, 0.2);
          gameOver = true;
          break;
        }
    }
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const gradient = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        0,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      gradient.addColorStop(0, '#ff8800');
      gradient.addColorStop(1, '#aa0000');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    // draw scrolling star background
    drawStars();
    updateStars();
    ship.update();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
    // spawn new asteroid every 60 frames (~1s at 60fps)
    if (frames++ % 60 === 0) spawnAsteroid();
    requestAnimationFrame(loop);
  }

  // Input handling
  const keys = {};
  // Ensure audio context is resumed on first user interaction
  let audioStarted = false;
  function ensureAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }

  window.addEventListener('keydown', e => {
    ensureAudio();
    if (e.key === 'ArrowLeft') ship.dx = -ship.speed;
    else if (e.key === 'ArrowRight') ship.dx = ship.speed;
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' && ship.dx < 0) ship.dx = 0;
    else if (e.key === 'ArrowRight' && ship.dx > 0) ship.dx = 0;
    keys[e.key] = false;
  });

  // Start the game loop
  loop();
})();
