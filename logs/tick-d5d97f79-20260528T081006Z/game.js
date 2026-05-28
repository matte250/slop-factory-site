// Asteroid Dodge game based on IDEA.md
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Create starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Game state
  const ship = { x: width / 2, y: height - 40, w: 30, h: 20, speed: 5 };
  const keys = { left: false, right: false, fire: false };
  const asteroids = [];
  const lasers = [];
  let score = 0;
  let lastFire = 0;
  const fireCooldown = 300; // ms
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ' || e.key === 'Spacebar') keys.fire = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === ' ' || e.key === 'Spacebar') keys.fire = false;
  });

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function fireLaser() {
    const now = Date.now();
    if (now - lastFire < fireCooldown) return;
    lastFire = now;
    // Play laser sound
    playTone(800, 100);
    lasers.push({ x: ship.x, y: ship.y - ship.h / 2, w: 2, h: 10, speed: 7 });
  }

  function update() {
    if (gameOver) return;

    // Twinkle stars
    stars.forEach(s => {
      s.alpha += (Math.random() - 0.5) * 0.05;
      if (s.alpha < 0.3) s.alpha = 0.3;
      if (s.alpha > 1) s.alpha = 1;
    });

    // Move ship
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    // Clamp ship within canvas
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Fire laser
    if (keys.fire) fireLaser();

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y + l.h < 0) lasers.splice(i, 1);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove if off screen
      if (a.y - a.r > height) {
        asteroids.splice(i, 1);
        score += 1; // surviving asteroid gives point
        continue;
      }
      // Collision with ship
      if (
        a.x + a.r > ship.x - ship.w / 2 &&
        a.x - a.r < ship.x + ship.w / 2 &&
        a.y + a.r > ship.y - ship.h / 2
      ) {
        gameOver = true;
        break;
      }
      // Collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (
          l.x > a.x - a.r && l.x < a.x + a.r &&
          l.y < a.y + a.r && l.y + l.h > a.y - a.r
        ) {
          // Destroy asteroid and laser
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          // Play explosion sound
          playTone(200, 200);
          score += 5;
          break;
        }
      }
    }

    // Randomly spawn asteroids (avg 1 per 60 frames)
    if (Math.random() < 0.02) spawnAsteroid();
  }

  function draw() {
    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw starfield (twinkling)
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(0, ship.y - ship.h / 2, 0, ship.y + ship.h / 2);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#090');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw lasers with glow effect
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;
    lasers.forEach(l => {
      ctx.fillRect(l.x - l.w / 2, l.y, l.w, l.h);
    });
    ctx.shadowBlur = 0; // reset

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px monospace';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '24px monospace';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game loop
  requestAnimationFrame(loop);
})();
