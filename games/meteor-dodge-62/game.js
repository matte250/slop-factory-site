// Simple Meteor Dodge game
// Canvas element expected with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback to 800x600)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;
  // Initialize background gradient and starfield
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#000');
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 0.5 + Math.random() * 1.5
    });
  }
  // Audio context for sound effects
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
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.2);
    }, duration);
  }
  function playSpawnSound(){ playTone(200, 50); }
  function playCollisionSound(){ playTone(100, 300); }


  // Ship definition
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // Draw ship as a triangle with gradient
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      gradient.addColorStop(0, '#0ff');
      gradient.addColorStop(1, '#00f');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      // Keep within bounds
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }
  };

  // Meteor pool
  const meteors = [];
  const meteorSpawnInterval = 800; // ms
  let lastSpawn = 0;

  function spawnMeteor() {
    const size = 20 + Math.random() * 30;
    const rotation = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.02; // radians per frame
    // Play spawn sound
    playSpawnSound();
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: 2 + Math.random() * 3,
      rotation,
      rotationSpeed,
      draw() {
        // Radial gradient for meteor
        const grad = ctx.createRadialGradient(this.x + this.size/2, this.y + this.size/2, this.size * 0.1, this.x + this.size/2, this.y + this.size/2, this.size/2);
        grad.addColorStop(0, '#ff8c00');
        grad.addColorStop(1, '#8b0000');
        ctx.fillStyle = grad;
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
      update(dt) {
        this.y += this.speed * dt;
        this.rotation += this.rotationSpeed * dt;
      }
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    ship.x = mx - ship.width/2;
    // Clamp
    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.width > canvas.width) ship.x = canvas.width - ship.width;
  });

  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  function update(dt) {
    // Ship movement
    ship.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.dx = ship.speed;
    ship.update();

    // Spawn meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.update(dt);
      // Remove off-screen
      if (m.y - m.size > canvas.height) {
        meteors.splice(i, 1);
        score++;
      }
    }

    // Collision detection
    for (const m of meteors) {
      if (
        ship.x < m.x + m.size &&
        ship.x + ship.width > m.x &&
        ship.y < m.y + m.size &&
        ship.y + ship.height > m.y
      ) {
        gameOver = true;
        // Play collision sound once
        playCollisionSound();
        break;
      }
    }
  }

  function draw() {
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ship.draw();
    meteors.forEach(m => m.draw());
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 16.666; // normalize to ~60fps units
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
