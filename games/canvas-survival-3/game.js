// Asteroid Dodge game
// Canvas element with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;
  // generate simple starfield
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Unlock audio on first user interaction
  const unlockAudio = () => { audioCtx.state !== 'running' && audioCtx.resume(); };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollision() {
    beep(200, 0.2);
  }
  function playGameOver() {
    beep(100, 0.5);
    beep(150, 0.5);
    beep(200, 0.5);
  }

  // Ship configuration
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // draw ship as a triangle
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
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > width) this.x = width - this.width;
    },
  };

  // Asteroid pool
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.04;
    asteroids.push({ x, y: -radius, radius, speed, angle, rotSpeed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.rotSpeed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const distX = Math.abs(a.x - (ship.x + ship.width / 2));
      const distY = Math.abs(a.y - (ship.y + ship.height / 2));
      if (distX > ship.width / 2 + a.radius) continue;
      if (distY > ship.height / 2 + a.radius) continue;
      if (distX <= ship.width / 2 || distY <= ship.height / 2) { playCollision(); return true; }
      const dx = distX - ship.width / 2;
      const dy = distY - ship.height / 2;
      if (dx * dx + dy * dy <= a.radius * a.radius) { playCollision(); return true; }
    }
    return false;
  }

  let gameOver = false;
  let gameOverPlayed = false;

  function renderGameOver() {
    // play game over sound once
    if (!gameOverPlayed) {
      playGameOver();
      gameOverPlayed = true;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  function gameLoop() {
    if (gameOver) {
      renderGameOver();
      return;
    }
    drawStars();
    ship.dx = 0;
    if (keys.left) ship.dx = -ship.speed;
    if (keys.right) ship.dx = ship.speed;
    ship.update();
    ship.draw();
    if (asteroidTimer++ >= asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
    updateAsteroids();
    drawAsteroids();
    if (checkCollision()) gameOver = true;
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
