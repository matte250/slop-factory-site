// Minimalist endless runner: Cosmic Escape
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  // Game objects
  const ship = { x: width / 2, y: height - 60, radius: 10, speedX: 0 };
  const asteroids = [];
  const stars = Array.from({ length: 80 }, () => ({ x: rand(0, width), y: rand(0, height), speed: rand(0.2, 1) }));
  let lastSpawn = 0;
  let distance = 0;
  let startTime = performance.now();
  let running = true;

  // Helper functions
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnAsteroid() {
    const radius = rand(8, 20);
    const x = rand(radius, width - radius);
    asteroids.push({ x, y: -radius, radius, speedY: rand(1, 3) });
  }
  function update(dt) {
    // Move ship sideways (smooth towards target)
    ship.x += ship.speedX * dt;
    if (ship.x < ship.radius) ship.x = ship.radius;
    if (ship.x > width - ship.radius) ship.x = width - ship.radius;

    // Spawn asteroids
    if (performance.now() - lastSpawn > 800) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speedY * dt;
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision detection
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
if (dx * dx + dy * dy < (a.radius + ship.radius) ** 2) {
          // Play crash sound
          playTone(120, 'square', 0.2);
          running = false;
        }
    }

    // Distance is based on time survived
    distance = Math.floor((performance.now() - startTime) / 10);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001028');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Simple moving star field with depth
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 2;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillRect(s.x, s.y, 1, 1);
      s.y += s.speed; // move down by individual speed
      if (s.y > height) {
        s.x = rand(0, width);
        s.y = 0;
        s.speed = rand(0.2, 1);
      }
    }
    // Reset shadow for other drawing
    ctx.shadowBlur = 0;
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    // Asteroids (gradient rocks)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#b5651d');
      grad.addColorStop(1, '#3e1a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Distance display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Distance: ${distance}`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Game Over`, width / 2, height / 2 - 20);
      ctx.fillText(`Final Distance: ${distance}`, width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - (lastFrame || timestamp)) / 16; // normalize to ~60fps
    lastFrame = timestamp;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);

  // Input: click/tap moves ship sideways towards click X
  canvas.addEventListener('pointerdown', e => {
    // Resume audio context on user interaction
    audioCtx.resume();
    // Play thrust sound
    playTone(440, 'sawtooth', 0.07);
    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const dir = targetX > ship.x ? 1 : -1;
    ship.speedX = dir * 0.3; // speed factor
    // Stop after reaching target (simplified)
    setTimeout(() => (ship.speedX = 0), 300);
  });
})();
