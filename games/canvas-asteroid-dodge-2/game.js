// Simple Asteroid Dodge game
// Assumes there is a <canvas id="game"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size (can be overridden by CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Generate starfield
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
    });
  }
  // Sound setup
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playTone(freq, duration) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playScoreSound() { playTone(800, 100); }
  function playCollisionSound() { playTone(200, 300); }

  // Player ship
  const ship = {
    x: 50,
    y: canvas.height / 2 - 15,
    width: 30,
    height: 30,
    speed: 5,
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update(input) {
      if (input.up) this.y = Math.max(0, this.y - this.speed);
      if (input.down) this.y = Math.min(canvas.height - this.height, this.y + this.speed);
    }
  };

  // Input handling
  const input = { up: false, down: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') input.up = true;
    else if (e.key === 'ArrowDown') input.down = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') input.up = false;
    else if (e.key === 'ArrowDown') input.down = false;
  });

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1200; // ms
  let lastTime = 0;
  let speedFactor = 1;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 40 + 10;
    const y = Math.random() * (canvas.height - size);
    const speed = 2 + Math.random() * 3; // base speed
    asteroids.push({ x: canvas.width, y, size, speed });
  }

  function update(delta) {
    if (gameOver) return;
    ship.update(input);
    // spawn
    asteroidTimer += delta;
    if (asteroidTimer > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * speedFactor;
      // collision detection (simple AABB)
        if (
          a.x < ship.x + ship.width &&
          a.x + a.size > ship.x &&
          a.y < ship.y + ship.height &&
          a.y + a.size > ship.y
        ) {
          playCollisionSound();
          gameOver = true;
        }
      // remove passed asteroids and increase score
        if (a.x + a.size < 0) {
          asteroids.splice(i, 1);
          score++;
          playScoreSound();
          // increase difficulty every 10 points
          if (score % 10 === 0) speedFactor += 0.2;
        }

    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#112');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship
    ship.draw();
    // asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2, a.y + a.size / 2, a.size * 0.1,
        a.x + a.size / 2, a.y + a.size / 2, a.size / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
