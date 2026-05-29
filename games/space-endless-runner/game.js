// Simple endless‑runner space game
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Full‑size canvas
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 5,
  };

  let left = false, right = false;
  const asteroids = [];
  const stars = [];
  const STAR_COUNT = 100;
  let spawnTimer = 0;
  let score = 0;
  let running = true;

  // Initialize starfield
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.2 + Math.random() * 0.4,
    });
  }

  // Input handling – arrow keys and mouse
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') {
      left = true;
      playTone(300, 0.05); // left thruster
    }
    if (e.key === 'ArrowRight') {
      right = true;
      playTone(300, 0.05); // right thruster
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function update() {
    // Move ship
    if (left) ship.x -= ship.speed;
    if (right) ship.x += ship.speed;
    // keep inside bounds
    ship.x = Math.max(ship.width / 2, Math.min(canvas.width - ship.width / 2, ship.x));

    // Move stars (parallax effect)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Spawn asteroids
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = 60; // roughly one per second at 60fps
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove if off screen
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        score++;
      } else if (checkCollision(a)) {
        running = false;
      }
    }
  }

  function checkCollision(asteroid) {
    // simple AABB vs circle collision
    const shipLeft = ship.x - ship.width / 2;
    const shipRight = ship.x + ship.width / 2;
    const shipTop = ship.y - ship.height / 2;
    const shipBottom = ship.y + ship.height / 2;
    const closestX = Math.max(shipLeft, Math.min(asteroid.x, shipRight));
    const closestY = Math.max(shipTop, Math.min(asteroid.y, shipBottom));
    const dx = asteroid.x - closestX;
    const dy = asteroid.y - closestY;
    return dx * dx + dy * dy < asteroid.radius * asteroid.radius;
  }

  function draw() {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // ship – triangle shape
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.height / 2);
    ctx.lineTo(ship.x - ship.width / 2, ship.y + ship.height / 2);
    ctx.lineTo(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // asteroids with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (!running) {
      draw();
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
