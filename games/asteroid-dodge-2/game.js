// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // create starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.05); }
  function playCrash() { playTone(100, 0.3); }


  // Ship definition
  const ship = {
    x: 50,
    y: HEIGHT / 2,
    width: 30,
    height: 20,
    speed: 4,
    dy: 0,
    draw() {
      // Draw ship as a green gradient triangle for a nicer look
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      grad.addColorStop(0, '#3f3');
      grad.addColorStop(1, '#0f0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    drawFlame() {
      if (!this.dy) return;
      const flameLength = this.dy < 0 ? 15 : 10;
      const baseY = this.y + this.height / 2;
      ctx.fillStyle = this.dy < 0 ? '#f80' : '#f44';
      ctx.beginPath();
      ctx.moveTo(this.x, baseY);
      ctx.lineTo(this.x - flameLength, this.y + (this.dy < 0 ? this.y : this.y + this.height));
      ctx.lineTo(this.x - flameLength, this.y + (this.dy < 0 ? this.y + this.height : this.y));
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      // keep within bounds
      if (this.y < 0) this.y = 0;
      if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    // Ensure audio context is running on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    ship.dy = 0;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    // Play thrust sound when moving
    if (ship.dy !== 0) playThrust();
    // optional left/right could be added
  }

  // Asteroid definition
  const asteroids = [];
  let asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let asteroidSpeed = 2;
  let speedIncreaseTimer = 0;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const y = Math.random() * (HEIGHT - size);
    asteroids.push({ x: WIDTH, y, size, speed: asteroidSpeed });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      gradient.addColorStop(0, '#aaa');
      gradient.addColorStop(1, '#444');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const distX = Math.max(ship.x, Math.min(a.x, ship.x + ship.width));
      const distY = Math.max(ship.y, Math.min(a.y, ship.y + ship.height));
      const dx = a.x - distX;
      const dy = a.y - distY;
      if (dx * dx + dy * dy < a.size * a.size) {
        return true;
      }
    }
    return false;
  }

  let score = 0;
  let gameOver = false;
  let lastTime = 0;

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // update and draw starfield background
    stars.forEach(s => { s.x -= 0.5; if (s.x < 0) s.x = WIDTH; });
    drawStars();
    handleInput();
    ship.update();
    ship.draw();
    ship.drawFlame();

    // spawn logic
    lastSpawn += dt;
    if (lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = 0;
    }

    // gradually increase difficulty
    speedIncreaseTimer += dt;
    if (speedIncreaseTimer > 10000) { // every 10 sec
      asteroidSpeed += 0.5;
      if (asteroidSpawnInterval > 500) asteroidSpawnInterval -= 100;
      speedIncreaseTimer = 0;
    }

    updateAsteroids(dt);
    drawAsteroids();

    // update score
    score += dt * 0.01;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (checkCollision()) {
      // Play crash sound on collision
      playCrash();
      gameOver = true;
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 120, HEIGHT / 2);
      return;
    }

    requestAnimationFrame(loop);
  }

  // start the loop
  requestAnimationFrame(loop);
})();
