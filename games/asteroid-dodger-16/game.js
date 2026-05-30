// Asteroid Dodger game implementation
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // quick fade in/out
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship definition
  // Generate star field background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  // Particle system for explosion
  const particles = [];
  const maxParticles = 50;
  // Ship definition
  // Represent ship as a triangle for better visuals
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Asteroid definition
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const speed = Math.random() * 2 + 1 + score / 1000; // increase speed with score
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed,
    });
  }

  function update(dt) {
    // move ship
    if (ship.moveLeft) ship.x -= ship.speed;
    if (ship.moveRight) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // spawn asteroids
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnAsteroid();
      spawnTimer = 0;
      // gradually increase difficulty
      spawnInterval = Math.max(200, spawnInterval - 10);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off-screen
if (a.y - a.size > height) {
          asteroids.splice(i, 1);
          score += 10;
          // play a small dodge sound
          playSound(300, 'sine', 0.05);
          continue;
        }
      // collision detection
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.width > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.height > a.y
      ) {
        gameOver = true;
        // play crash sound
        playSound(120, 'sawtooth', 0.3);
        // generate explosion particles
        for (let i = 0; i < maxParticles; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 2;
          particles.push({
            x: ship.x + ship.width / 2,
            y: ship.y + ship.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: Math.random() * 30 + 30,
            radius: Math.random() * 2 + 1,
          });
        }
      }
    }

    // update particles (simple physics)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (!gameOver) score += dt * 0.01; // score for survival time
  }

  function draw() {
    // draw star field background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // draw asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 4,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw particles (explosion)
    for (const p of particles) {
      const alpha = Math.max(p.life / 60, 0);
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
