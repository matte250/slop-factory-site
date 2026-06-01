// Simple canvas arena game based on IDEA.md
// The HTML contains <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or default 800x600
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume context on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('keydown', resumeAudio);
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playShieldSound() { beep(600, 0.2); }
  function playExplosionSound() { beep(100, 0.4); }
  function playGameOverSound() { beep(50, 0.6); }

  // Create starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 30,
    height: 40,
    speed: 4,
    shield: false,
    draw() {
      // Ship body with gradient for depth
      const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.height);
      grad.addColorStop(0, this.shield ? '#00ffff' : '#fff');
      grad.addColorStop(1, this.shield ? '#0099ff' : '#ccc');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      // horizontal movement via arrow keys
      if (keys['ArrowLeft'] && this.x - this.width / 2 > 0) this.x -= this.speed;
      if (keys['ArrowRight'] && this.x + this.width / 2 < canvas.width) this.x += this.speed;
      // add current position to trail
      trail.push({ x: this.x, y: this.y, age: 0 });
    },
  };

  let asteroids = [];
  let shields = [];
  let distance = 0;
  const keys = {};
  // ship trail for motion blur
  const trail = [];

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size) + size / 2;
    const y = -size;
    const speed = Math.random() * 2 + 1;
    const rotation = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.02; // small spin
    asteroids.push({ x, y, size, speed, rotation, rotationSpeed });
  }

  function spawnShield() {
    const size = 20;
    const x = Math.random() * (canvas.width - size) + size / 2;
    const y = -size;
    const speed = 2;
    shields.push({ x, y, size, speed, duration: 5000 }); // ms shield lasts
  }

  let asteroidTimer = 0;
  let shieldTimer = 0;

  function updateObjects(dt) {
    // Move asteroids
    asteroids.forEach(a => {
      a.y += a.speed;
      a.rotation += a.rotationSpeed;
    });
    // Remove off‑screen
    asteroids = asteroids.filter(a => a.y - a.size < canvas.height);

    // Move shields
    shields.forEach(s => (s.y += s.speed));
    shields = shields.filter(s => s.y - s.size < canvas.height);

    // Move stars for parallax effect
    stars.forEach(st => {
      st.y += 0.3; // slower than asteroids
      if (st.y > canvas.height) {
        st.y = 0;
        st.x = Math.random() * canvas.width;
        st.alpha = Math.random() * 0.5 + 0.5;
      }
    });

    // Age and prune ship trail
    trail.forEach(p => p.age++);
    // keep recent points only
    while (trail.length > 30) trail.shift();

    // Collision ship‑asteroid
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      const dx = Math.abs(ship.x - a.x);
      const dy = Math.abs((ship.y + ship.height / 2) - a.y);
      if (dx < (ship.width / 2 + a.size / 2) && dy < (ship.height / 2 + a.size / 2)) {
        if (ship.shield) {
          // destroy asteroid with sound
          playExplosionSound();
          asteroids.splice(i, 1);
          i--;
        } else {
          // game over with sound
          playGameOverSound();
          endGame();
          return;
        }
      }
    }

    // Collision ship‑shield
    for (let i = 0; i < shields.length; i++) {
      const s = shields[i];
      const dx = Math.abs(ship.x - s.x);
      const dy = Math.abs((ship.y + ship.height / 2) - s.y);
      if (dx < (ship.width / 2 + s.size / 2) && dy < (ship.height / 2 + s.size / 2)) {
        ship.shield = true;
        playShieldSound();
        setTimeout(() => (ship.shield = false), s.duration);
        shields.splice(i, 1);
        i--;
      }
    }

    // Spawn timers
    asteroidTimer += dt;
    shieldTimer += dt;
    if (asteroidTimer > 800) { // every 0.8s
      spawnAsteroid();
      asteroidTimer = 0;
    }
    if (shieldTimer > 5000) { // every 5s
      spawnShield();
      shieldTimer = 0;
    }

    distance += dt / 1000; // meters per second approximation
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#113');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    drawStars();

    // Draw ship trail (motion blur)
    trail.forEach(p => {
      const alpha = Math.max(0, 1 - p.age * 0.05);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    // Shield glow when active
    if (ship.shield) {
      ctx.save();
      ctx.translate(ship.x, ship.y + ship.height / 2);
      const glowGrad = ctx.createRadialGradient(0, 0, ship.width, 0, 0, ship.width * 2);
      glowGrad.addColorStop(0, 'rgba(0,255,255,0.4)');
      glowGrad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ship.width * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw ship
    ship.draw();

    // Draw asteroids with shading and rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      const grad = ctx.createRadialGradient(
        0, 0, a.size * 0.1,
        0, 0, a.size / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Draw shields
    ctx.fillStyle = 'gold';
    shields.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`Distance: ${distance.toFixed(1)}m`, 10, 20);
    if (ship.shield) ctx.fillText('Shield: ON', 10, 40);
  }

  let lastTime = performance.now();
  let running = true;
  function loop(now) {
    if (!running) return;
    const dt = now - lastTime;
    lastTime = now;
    ship.update();
    updateObjects(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Distance: ${distance.toFixed(1)} m`, canvas.width / 2, canvas.height / 2 + 40);
  }

  requestAnimationFrame(loop);
})();
