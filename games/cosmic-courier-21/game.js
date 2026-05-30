// Simple Cosmic Courier game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Utility
  const rand = (a, b) => a + Math.random() * (b - a);
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // Starfield particles
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      size: rand(0.5, 2),
      speed: rand(0.2, 0.6)
    });
  }

  // Thruster particles
  let thrusters = [];
  const maxThrusters = 200;
  // Ship
  const ship = {
    x: width * 0.1,
    y: height / 2,
    radius: 10,
    speed: 4,
    dx: 0,
    dy: 0,
    update() {
      this.x = Math.max(this.radius, Math.min(width - this.radius, this.x + this.dx));
      this.y = Math.max(this.radius, Math.min(height - this.radius, this.y + this.dy));
    },
    draw() {
      // Ship with gradient and simple triangle shape
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#0ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x + this.radius, this.y);
      ctx.lineTo(this.x - this.radius, this.y - this.radius * 0.6);
      ctx.lineTo(this.x - this.radius, this.y + this.radius * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Packages
  const packages = [];
  function spawnPackage() {
    packages.push({
      x: -20,
      y: rand(20, height - 20),
      radius: 8,
      speed: 2,
      collected: false
    });
  }
  // Asteroids
  const asteroids = [];
  function spawnAsteroid() {
    asteroids.push({
      x: width + 20,
      y: rand(20, height - 20),
      radius: rand(12, 20),
      speed: rand(1.5, 3)
    });
  }

  let score = 0;
  let gameOver = false;
  let packageTimer = 0;
  let asteroidTimer = 0;

  // Input handling
  const keys = {};
  let audioStarted = false;
  function ensureAudio() {
    if (!audioStarted && audioCtx.state !== 'running') {
      audioCtx.resume();
      audioStarted = true;
    }
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    ensureAudio();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function handleInput() {
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
  }

  function update() {
    if (gameOver) return;
    handleInput();
    ship.update();

    // Emit thruster particles when moving
    if (ship.dx !== 0 || ship.dy !== 0) {
      const count = 5;
      for (let i = 0; i < count; i++) {
        thrusters.push({
          x: ship.x - ship.radius,
          y: ship.y + (Math.random() - 0.5) * ship.radius,
          size: rand(1, 3),
          spawn: Date.now()
        });
      }
      if (thrusters.length > maxThrusters) thrusters.splice(0, thrusters.length - maxThrusters);
    }

    // Update starfield positions
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = rand(0, height);
      }
    });

    // Move packages
    packages.forEach(p => p.x += p.speed);
    // Move asteroids
    asteroids.forEach(a => a.x -= a.speed);

    // Collision detection
    packages.forEach(p => {
      if (!p.collected && dist(p.x, p.y, ship.x, ship.y) < p.radius + ship.radius) {
        p.collected = true;
        score += 10;
        // sound for collection
        playTone(660, 0.08);
        // brief boost
        ship.speed = 6;
        setTimeout(() => (ship.speed = 4), 200);
      }
    });
    asteroids.forEach(a => {
      if (dist(a.x, a.y, ship.x, ship.y) < a.radius + ship.radius) {
        gameOver = true;
      }
    });
    // Remove off‑screen entities and check lose condition
    packages.forEach((p, i) => {
      if (p.x > width && !p.collected) gameOver = true;
      if (p.x > width || p.collected) packages.splice(i, 1);
    });
    asteroids.forEach((a, i) => {
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    });
    // Spawn timing
    if (packageTimer++ > 100) { spawnPackage(); packageTimer = 0; }
    if (asteroidTimer++ > 150) { spawnAsteroid(); asteroidTimer = 0; }
  }

  function draw() {
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw moving starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Draw thruster particles (fading circles)
    thrusters.forEach(t => {
      const age = (Date.now() - t.spawn) / 1000; // seconds
      const alpha = Math.max(0, 1 - age * 2);
      if (alpha <= 0) return;
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ship.draw();

    // Packages as glowing squares
    ctx.fillStyle = '#ff0';
    packages.forEach(p => {
      if (!p.collected) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      }
    });

    // Asteroids with gradient shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
