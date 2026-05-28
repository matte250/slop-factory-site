// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Setup starfield background
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
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship (triangle) definition
  const ship = {
    x: 80,
    y: height / 2,
    size: 20,
    speed: 4,
  };

  // Input handling
  const keys = { ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      // Play movement sound
      playTone(440, 0.08);
    }
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroids (circles)
  const asteroids = [];
  const asteroidFreq = 90; // frames between spawns (approx)
  let frameCount = 0;
  let score = 0;
  const startTime = performance.now();

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const speed = Math.random() * 2 + 2; // leftward speed
    asteroids.push({
      x: width + size,
      y: Math.random() * height,
      r: size,
      speed,
    });
  }

  function update() {
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Wrap vertically
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // Spawn asteroids
    if (frameCount % asteroidFreq === 0) spawnAsteroid();
    frameCount++;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Collision detection (approximate ship as circle)
    const shipR = ship.size * 0.6;
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.r + shipR) ** 2) {
        // Game over
        cancelAnimationFrame(animId);
        // Play crash sound
        playTone(100, 0.3);
        ctx.fillStyle = 'red';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2);
        return;
      }
    }
  }

  function draw() {
    // Draw moving starfield background
    // Clear background with dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Update and draw moving starfield
    ctx.fillStyle = '#fff';
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
        s.r = Math.random() * 2 + 0.5;
        s.speed = Math.random() * 0.5 + 0.2;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship (triangle pointing right) with glow
    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.size, ship.y - ship.size / 2);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Draw asteroids with subtle shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw score
    score = Math.floor((performance.now() - startTime) / 100);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 80, 30);
  }

  let animId;
  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }
  loop();
})();
