// Simple endless runner based on IDEA.md
// Enhanced graphics: starfield background, ship thrust flame, asteroid shading
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  // Create starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure AudioContext starts after user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playBeep(300, 0.05); }
  function playCrash() { playBeep(100, 0.3); }

  // ----- Ship -----
  // Add thrust flame rendering when accelerating
  const ship = {
    // track thrust for flame rendering
    thrusting: false,
    x: width / 2,
    y: height / 2,
    r: 15, // radius for collision
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.05,
    update() {
      // Apply velocity damping
      this.vx *= 0.99;
      this.vy *= 0.99;
      this.x += this.vx;
      this.y += this.vy;
      // Wrap around edges
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
    },
    draw() {
      // Draw thrust flame if accelerating
      if (this.thrusting) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(4, 20);
        ctx.lineTo(-4, 20);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
      }
      // Draw ship body
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 12);
      ctx.lineTo(-8, 12);
      ctx.closePath();
      ctx.fillStyle = '#0f0';
      ctx.fill();
      ctx.restore();
    },
    accelerate() {
      this.vx += Math.cos(this.angle) * this.thrust;
      this.vy += Math.sin(this.angle) * this.thrust;
      playThrust();
    }
  };

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidMaxSpeed = 2;
  const asteroidMinRadius = 10;
  const asteroidMaxRadius = 30;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    // Spawn just outside a random edge
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -asteroidMaxRadius;
      vx = (Math.random() - 0.5) * asteroidMaxSpeed;
      vy = Math.random() * asteroidMaxSpeed + 0.5;
    } else if (edge === 1) { // right
      x = width + asteroidMaxRadius;
      y = Math.random() * height;
      vx = -Math.random() * asteroidMaxSpeed - 0.5;
      vy = (Math.random() - 0.5) * asteroidMaxSpeed;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + asteroidMaxRadius;
      vx = (Math.random() - 0.5) * asteroidMaxSpeed;
      vy = -Math.random() * asteroidMaxSpeed - 0.5;
    } else { // left
      x = -asteroidMaxRadius;
      y = Math.random() * height;
      vx = Math.random() * asteroidMaxSpeed + 0.5;
      vy = (Math.random() - 0.5) * asteroidMaxSpeed;
    }
    const radius = Math.random() * (asteroidMaxRadius - asteroidMinRadius) + asteroidMinRadius;
    asteroids.push({ x, y, vx, vy, r: radius });
  }

  setInterval(spawnAsteroid, asteroidSpawnInterval);

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ----- Game loop -----
  let startTime = null;
  let gameOver = false;
  let crashPlayed = false;

  function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  }

  function update(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (startTime || timestamp);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      const secs = ((timestamp - startTime) / 1000).toFixed(1);
      ctx.fillText(`Score: ${secs}s`, width / 2 - 60, height / 2 + 30);
      return;
    }

    // Input handling
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp'] || keys['KeyW']) { ship.accelerate(); ship.thrusting = true; }
    else { ship.thrusting = false; }

    ship.update();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove off‑screen
      if (a.x < -a.r || a.x > width + a.r || a.y < -a.r || a.y > height + a.r) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision
if (checkCollision(ship, a)) {
          gameOver = true;
          if (!crashPlayed) { playCrash(); crashPlayed = true; }
        }
    }

    // Render
    ctx.clearRect(0, 0, width, height);
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = 'white';
    for (let s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    ship.draw();
    // Draw asteroids with shading
    for (const a of asteroids) {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      gradient.addColorStop(0, '#bbb');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const seconds = ((timestamp - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${seconds}s`, 10, 20);

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
})();
