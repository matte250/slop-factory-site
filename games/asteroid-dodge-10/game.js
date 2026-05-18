// Simple Asteroid Dodge game targeting canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Create background stars
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollisionSound() { playSound(150, 0.2); }
  let lastMoveSound = 0;
  function playMoveSound() {
    const now = performance.now();
    if (now - lastMoveSound > 100) { // throttle 10Hz
      playSound(400, 0.05);
      lastMoveSound = now;
    }
  }

  const ship = { x: canvas.width / 2, y: canvas.height - 50, radius: 15 };
  let mouseX = ship.x;

  // Game state
  let asteroids = [];
  let lives = 3;
  let score = 0;
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms

  // Mouse control
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function update(dt) {
    // Update ship position smoothly towards mouse
    ship.x += (mouseX - ship.x) * 0.1;
    // Play subtle movement sound
    playMoveSound();
    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);
    // Update stars for subtle twinkle/movement
    stars.forEach(s => {
      s.y += 0.3;
      if (s.y > canvas.height) s.y = 0;
    });
    // Remove off‑screen asteroids and increase score
    asteroids = asteroids.filter(a => {
      if (a.y - a.radius > canvas.height) {
        score += Math.floor(a.radius);
        return false;
      }
      return true;
    });
    // Collision detection
    asteroids.forEach(a => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        lives--;
        playCollisionSound();
        // Reset asteroid
        a.y = canvas.height + a.radius;
        if (lives <= 0) {
          // Game over – stop animation
          cancelAnimationFrame(animId);
          alert('Game Over! Score: ' + score);
        }
      }
    });
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship as triangle
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.2,
        a.x, a.y, a.radius
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + lives, 10, 20);
    ctx.fillText('Score: ' + score, 10, 40);
  }

  let lastTime = performance.now();
  let animId;
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (now - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
})();
