// Simple Asteroid Dodge game
// Assumes a <canvas id="game"></canvas> exists in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // star field (generated once)
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5
  }));

  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // draw ship as a simple triangle
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > width) this.x = width - this.w;
    }
  };

  const asteroids = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -radius, r: radius, s: speed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.s;
      // remove if off screen
      if (a.y - a.r > height) {
        asteroids.splice(i, 1);
        score++;
        // play short beep for successful dodge
        playBeep(300, 0.08);
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

function drawAsteroids() {
    asteroids.forEach(a => {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      gradient.addColorStop(0, '#bbb');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      // simple rectangle-circle overlap test
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      const dx = a.x - closestX;
      const dy = a.y - closestY;
      if (dx * dx + dy * dy < a.r * a.r) {
        return true;
      }
    }
    return false;
  }

  function loop() {
    if (gameOver) return;
    // dark space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    drawStars();
    ship.update();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (checkCollision()) {
      gameOver = true;
      // play collision sound
      playBeep(120, 0.4);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      console.log('Final score:', score);
      return;
    }
    // spawn roughly every 60 frames
    if (frames % 60 === 0) spawnAsteroid();
    frames++;
    requestAnimationFrame(loop);
  }

  // Input handling
  const keys = {};
    // Resume AudioContext on first user interaction (required by some browsers)
    window.addEventListener('click', () => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }, {once: true});
    window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    ship.dx = (keys.right ? ship.speed : 0) - (keys.left ? ship.speed : 0);
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    ship.dx = (keys.right ? ship.speed : 0) - (keys.left ? ship.speed : 0);
  });

  // start
  loop();
})();
