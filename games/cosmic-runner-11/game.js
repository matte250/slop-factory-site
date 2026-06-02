// Simple endless runner based on IDEA.md
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context runs after user interaction
  function initAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function beep(freq, duration) {
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
  function playThrustSound() { beep(300, 0.07); }
  function playCollisionSound() { beep(150, 0.4); }
  // Simple background hum
  let humInterval;
  function startHum() { humInterval = setInterval(() => beep(80, 0.2), 2000); }
  function stopHum() { clearInterval(humInterval); }

  // Game objects
  const ship = {
    x: 80,
    y: height / 2,
    w: 40,
    h: 30,
    vy: 0,
    thrustPower: -0.8,
    gravity: 0.02,
    thrusting: false,
    draw() {
      // Ship body with gradient
      const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
      // Thruster flame
      if (this.thrusting) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x - this.w / 2, this.y);
        ctx.lineTo(this.x - this.w / 2 - 10, this.y - 5);
        ctx.lineTo(this.x - this.w / 2 - 10, this.y + 5);
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  const obstacles = [];
  let frame = 0;
  let score = 0;
  let running = true;

  function spawnObstacle() {
    const size = 30 + Math.random() * 40;
    obstacles.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 2
    });
  }

  function update() {
    if (!running) return;
    frame++;
    // Ship physics
    ship.vy += ship.gravity;
    ship.y += ship.vy;
    if (ship.y > height - ship.h / 2) {
      ship.y = height - ship.h / 2;
      ship.vy = 0;
    }
    if (ship.y < ship.h / 2) {
      ship.y = ship.h / 2;
      ship.vy = 0;
    }
    // Obstacles
    if (frame % 90 === 0) spawnObstacle();
    obstacles.forEach(o => o.x -= o.speed);
    // Remove off-screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // Collision detection
    for (const o of obstacles) {
      if (rectIntersect(ship, o)) {
        running = false;
        // Play collision sound and stop background hum
        playCollisionSound();
        stopHum();
        break;
      }
    }
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (running) score++;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw moving stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const sx = (Math.random() * width + frame * 0.5) % width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 2, 2);
    }
    // Ship
    ship.draw();
    // Obstacles (asteroids)
    obstacles.forEach(o => {
      ctx.save();
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w/4, o.x + o.w/2, o.y + o.h/2, o.w/2);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 30);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', width / 2 - 100, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Input handling
  const particles = [];
  function createParticle(x, y) {
    particles.push({
      x,
      y,
      vy: -0.5 - Math.random() * 0.3,
      life: 30 + Math.random() * 20,
      size: 2 + Math.random() * 2
    });
  }
  let humStarted = false;
  function onThrust() {
    initAudio();
    if (!humStarted) { startHum(); humStarted = true; }
    ship.vy = ship.thrustPower;
    ship.thrusting = true;
    playThrustSound();
    createParticle(ship.x - ship.w / 2, ship.y);
    setTimeout(() => ship.thrusting = false, 80);
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') onThrust(); });
  canvas.addEventListener('click', onThrust);

  // Start loop
  requestAnimationFrame(loop);
})();
