// Space Debris Dodger – minimal implementation
// Targets <canvas id="game"></canvas> in the host page

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrusterOsc = null;
  function startThruster() {
    if (thrusterOsc) return;
    thrusterOsc = audioCtx.createOscillator();
    thrusterOsc.type = 'sawtooth';
    thrusterOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrusterOsc.connect(gain).connect(audioCtx.destination);
    thrusterOsc.start();
  }
  function stopThruster() {
    if (!thrusterOsc) return;
    thrusterOsc.stop();
    thrusterOsc.disconnect();
    thrusterOsc = null;
  }
  function playCrash() {
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Ship – simple triangle
  const ship = {
    x: width / 2,
    y: height - 50,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
    draw() {
      // Determine orientation based on movement; default up
      let angle = -Math.PI / 2;
      if (this.dx !== 0 || this.dy !== 0) {
        angle = Math.atan2(this.dy, this.dx) + Math.PI / 2;
      }
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      // ship body – gradient triangle
      const grad = ctx.createLinearGradient(0, -this.size, 0, this.size);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#0ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(-this.size, this.size);
      ctx.lineTo(this.size, this.size);
      ctx.closePath();
      ctx.fill();
      // thruster flame when accelerating
      if (this.dy < 0) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(0, this.size);
        ctx.lineTo(-this.size / 2, this.size + this.size / 2);
        ctx.lineTo(this.size / 2, this.size + this.size / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
    update() {
      this.x = Math.max(this.size, Math.min(width - this.size, this.x + this.dx));
      this.y = Math.max(this.size, Math.min(height - this.size, this.y + this.dy));
    },
  };

  // Asteroids – array of circles
  // Starfield setup
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001d3d');
  bgGradient.addColorStop(1, '#000814');

  const asteroids = [];
  const asteroidConfig = {
    minSize: 10,
    maxSize: 30,
    minSpeed: 1,
    maxSpeed: 3,
    spawnRate: 0.02, // chance per frame
  };

  function spawnAsteroid() {
    const size = Math.random() * (asteroidConfig.maxSize - asteroidConfig.minSize) + asteroidConfig.minSize;
    const x = Math.random() * (width - size * 2) + size;
    const y = -size;
    const speed = Math.random() * (asteroidConfig.maxSpeed - asteroidConfig.minSpeed) + asteroidConfig.minSpeed;
    const rotation = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // slight spin
    asteroids.push({ x, y, size, speed, rotation, rotSpeed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.rotation += a.rotSpeed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
    // spawn new asteroids randomly
    if (Math.random() < asteroidConfig.spawnRate) spawnAsteroid();
  }

  function drawAsteroids() {
    // draw each asteroid with rotation for visual flair
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.beginPath();
      // irregular polygon approximating a rock
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = a.size * (0.7 + Math.random() * 0.3);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.size) return true;
    }
    return false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  function handleInput() {
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft || keys.a) ship.dx = -ship.speed;
    if (keys.ArrowRight || keys.d) ship.dx = ship.speed;
    if (keys.ArrowUp || keys.w) ship.dy = -ship.speed;
    if (keys.ArrowDown || keys.s) ship.dy = ship.speed;
    // thruster sound while accelerating upwards
    if (ship.dy < 0) {
      startThruster();
    } else {
      stopThruster();
    }
  }

  // Score – time survived in seconds
  let startTime = performance.now();
  let gameOver = false;

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      const secs = ((performance.now() - startTime) / 1000).toFixed(1);
      ctx.fillText(`Game Over – ${secs}s`, width / 2 - 150, height / 2);
      return;
    }
    // draw scrolling starfield background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > height) s.y = 0;
    }
    handleInput();
    ship.update();
    updateAsteroids();
    drawAsteroids();
    ship.draw();
    if (checkCollision()) {
      playCrash();
      gameOver = true;
    }
    // draw score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    const secs = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${secs}s`, 10, 20);
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
