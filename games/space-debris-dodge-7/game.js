// Simple game based on IDEA.md – Space Debris Dodge
// Assumes an HTML canvas element <canvas id="game"></canvas> exists.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context runs after user interaction
  canvas.addEventListener('click', () => audioCtx.resume());
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playSpawnSound() { playTone(200, 80); }
  function playCollisionSound() { playTone(100, 300); }

  // Starfield background
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      twinkle: Math.random() * Math.PI * 2
    });
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 40,
    h: 20,
    speed: 5,
    color: '#0ff',
    draw() {
      // Gradient ship body
      const shipGrad = ctx.createLinearGradient(this.x - this.w/2, this.y, this.x + this.w/2, this.y + this.h);
      shipGrad.addColorStop(0, '#0ff');
      shipGrad.addColorStop(1, '#00a');
      ctx.fillStyle = shipGrad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // Ship outline glow
      ctx.strokeStyle = 'rgba(0,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Input handling – arrow keys and mouse move
  const input = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') input.left = true;
    if (e.key === 'ArrowRight') input.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') input.left = false;
    if (e.key === 'ArrowRight') input.right = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, mouseX));
  });

  // Debris objects
  const debris = [];
  const debrisSpawnInterval = 800; // ms
  let lastSpawn = 0;

  function spawnDebris() {
    const size = Math.random() * 30 + 10;
    debris.push({
      x: Math.random() * (width - size) + size / 2,
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 2,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      color: '#f55'
    });
    playSpawnSound();
  }

  // Collision detection
  function collides(a, b) {
    return a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y;
  }

  let distance = 0;
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;

    // Move ship based on keyboard
    if (input.left) ship.x -= ship.speed;
    if (input.right) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Spawn debris
    if (performance.now() - lastSpawn > debrisSpawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // Update debris positions
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed;
      if (d.y - d.h > height) debris.splice(i, 1);
    }

    // Update starfield (move down and recycle)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = -s.radius;
        s.x = Math.random() * width;
        s.speed = Math.random() * 0.4 + 0.1;
        s.twinkle = Math.random() * Math.PI * 2;
      }
    }

    // Check collisions
    for (const d of debris) {
      if (collides(ship, d)) {
        gameOver = true;
        playCollisionSound();
        break;
      }
    }

    // Increment distance (approx meters per frame)
    distance += dt * 0.02; // arbitrary scaling
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars (twinkling)
    for (const s of stars) {
      const alpha = 0.5 + 0.5 * Math.sin(s.twinkle + performance.now() * 0.005);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship with gradient outline
    ship.draw();
    // Debris with gradient fill and rotation
    for (const d of debris) {
      // Update rotation
      d.rotation += d.rotationSpeed;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.w / 2);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.fillStyle = grad;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }
    // UI – distance
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText(`Distance: ${Math.floor(distance)} m`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px monospace';
      ctx.fillText(`Survived: ${Math.floor(distance)} m`, width / 2, height / 2 + 20);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
