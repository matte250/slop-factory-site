// Asteroid Dodger Game
// Enhanced graphics: starfield background, gradient ship and asteroids, simple thruster effect.
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrusterOsc = null;

  function startThruster() {
    if (thrusterOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrusterOsc = { osc, gain };
  }

  function stopThruster() {
    if (!thrusterOsc) return;
    thrusterOsc.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrusterOsc.osc.stop(audioCtx.currentTime + 0.1);
    thrusterOsc = null;
  }

  function playExplosion() {
    const length = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    source.connect(gain).connect(audioCtx.destination);
    source.start();
  }

  // Ensure audio context starts after user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Hook resume to first key press
  document.addEventListener('keydown', resumeAudio, { once: true });

  const canvas = document.getElementById('game');
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2
  }));

  const ship = {
    x: width / 2,
    y: height - 40,
    radius: 15,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      // gradient ship
      const grad = ctx.createLinearGradient(this.x, this.y - this.radius, this.x, this.y + this.radius);
      grad.addColorStop(0, '#00f'); // top blue
      grad.addColorStop(1, '#0ff'); // bottom cyan
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius);
      ctx.lineTo(this.x - this.radius, this.y + this.radius);
      ctx.lineTo(this.x + this.radius, this.y + this.radius);
      ctx.closePath();
      ctx.fill();
      // thruster flame when moving
      if (this.moveLeft || this.moveRight) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x - this.radius / 2, this.y + this.radius + 10);
        ctx.lineTo(this.x + this.radius / 2, this.y + this.radius + 10);
        ctx.closePath();
        ctx.fill();
      }
    },
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      // keep within bounds
      this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    }
  };

  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  const asteroidSpeed = 2;
  const asteroidRadius = 20;

  let lives = 3;
  let startTime = performance.now();
  let gameOver = false;

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') {
      ship.moveLeft = true;
      startThruster();
    }
    if (e.code === 'ArrowRight') {
      ship.moveRight = true;
      startThruster();
    }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') ship.moveLeft = false;
    if (e.code === 'ArrowRight') ship.moveRight = false;
    // stop thruster when no keys pressed
    if (!ship.moveLeft && !ship.moveRight) {
      stopThruster();
    }
  });

  function spawnAsteroid() {
    const x = Math.random() * (width - asteroidRadius * 2) + asteroidRadius;
    asteroids.push({
      x,
      y: -asteroidRadius,
      radius: asteroidRadius,
      // random gray shade for variation
      shade: Math.floor(Math.random() * 155) + 100
    });
  }

  function update(delta) {
    if (gameOver) return;
    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // update starfield
    for (let s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // ship movement
    ship.update();
    // asteroids movement & collision
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += asteroidSpeed;
      // collision detection
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        lives--;
        asteroids.splice(i, 1);
        playExplosion();
        if (lives <= 0) {
          gameOver = true;
        }
        continue;
      }
      // remove off‑screen asteroids
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
      }
    }
  }

  function render() {
    // background
    ctx.fillStyle = '#000010'; // dark space color
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship
    ship.draw();
    // asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, `rgb(${a.shade},${a.shade},${a.shade})`);
      grad.addColorStop(1, `rgb(${a.shade - 30},${a.shade - 30},${a.shade - 30})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI overlay
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${lives}`, 10, 20);
    const score = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillText(`Score: ${score}s`, 10, 40);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
