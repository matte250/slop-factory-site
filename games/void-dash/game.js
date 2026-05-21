// Minimal Void Dash game implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas to fill window (adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = {
    x: 80,
    y: canvas.height / 2,
    radius: 12,
    speed: 4,
  };

  const asteroids = [];
  // Starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

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
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const asteroidFreq = 1500; // ms
  const asteroidSpeed = 3;
  let lastAsteroid = 0;
  let running = true;
  let score = 0;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const y = Math.random() * (canvas.height - size) + size / 2;
    asteroids.push({ x: canvas.width + size, y, radius: size / 2 });
    // Play spawn sound
    playTone(400, 0.08);
  }

  function update(dt) {
    // Ship control – up/down arrows
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // Keep within bounds
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      if (a.x + a.radius < 0) {
        asteroids.splice(i, 1);
        score++;
        } else if (circleCollide(ship, a)) {
          // Collision sound
          playTone(200, 0.2);
          running = false;
        }

    }

    // Move stars for parallax effect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }

    // Spawn new asteroids
    if (performance.now() - lastAsteroid > asteroidFreq) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#000030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Starfield (moving tiny stars)
    stars.forEach(star => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Ship – simple green triangle with glow
    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + 10, ship.y);
    ctx.lineTo(ship.x - 10, ship.y - 8);
    ctx.lineTo(ship.x - 10, ship.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids – radial gradient for depth
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius);
      grad.addColorStop(0, '#a00');
      grad.addColorStop(1, '#300');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!prevTime) prevTime = timestamp;
    const dt = timestamp - prevTime;
    prevTime = timestamp;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function circleCollide(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const dist = Math.hypot(dx, dy);
    return dist < c1.radius + c2.radius;
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction (autoplay policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Also resume on mouse click/touch
  const resumeHandler = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', resumeHandler);
    window.removeEventListener('touchstart', resumeHandler);
  };
  window.addEventListener('click', resumeHandler);
  window.addEventListener('touchstart', resumeHandler);

  let prevTime = null;
  requestAnimationFrame(loop);
})();
