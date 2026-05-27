// Simple Orbit Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth);
  const H = (canvas.height = canvas.clientHeight);

  // Game parameters
  const planet = { x: W / 2, y: H / 2, r: 40, color: '#2c3e50' };
  const ship = { r: 8, color: '#e74c3c', angle: 0, distance: 120 };
  const asteroids = [];
  const asteroidConfig = { minSize: 6, maxSize: 16, speed: 1.2, spawnRate: 1500 };
  let lives = 3;
  let score = 0;
  let lastSpawn = 0;
  let angularSpeed = 0.02; // radians per frame

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
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration);
  }
  function playCollision() { playTone(200, 200); }
  function playScore() { playTone(800, 100); }

  // Input – left/right to change orbit direction
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') angularSpeed -= 0.005;
    if (e.key === 'ArrowRight') angularSpeed += 0.005;
  });

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(W, H); // start off‑screen
    const size = Math.random() * (asteroidConfig.maxSize - asteroidConfig.minSize) + asteroidConfig.minSize;
    const speed = asteroidConfig.speed * (0.5 + Math.random());
    asteroids.push({ angle, distance, size, speed });
  }

  function update(dt) {
    // ship orbit
    ship.angle += angularSpeed;

    // move asteroids inward
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.distance -= a.speed;
      if (a.distance < 0) {
        asteroids.splice(i, 1);
        lives--;
        if (lives <= 0) {
          cancelAnimationFrame(animId);
          alert('Game Over! Score: ' + Math.floor(score));
        }
        continue;
      }
      // collision check (approximate as circles)
      const ax = planet.x + Math.cos(a.angle) * a.distance;
      const ay = planet.y + Math.sin(a.angle) * a.distance;
      const sx = planet.x + Math.cos(ship.angle) * ship.distance;
      const sy = planet.y + Math.sin(ship.angle) * ship.distance;
      const dx = ax - sx;
      const dy = ay - sy;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.r) {
        asteroids.splice(i, 1);
        lives--;
        playCollision();
        if (lives <= 0) {
          cancelAnimationFrame(animId);
          alert('Game Over! Score: ' + Math.floor(score));
        }
      } else if (a.distance < ship.distance) {
        // passed ship safely
        score += 1;
        playScore();
        asteroids.splice(i, 1);
      }
    }

    // spawn new asteroids
    if (Date.now() - lastSpawn > asteroidConfig.spawnRate) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // background stars
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
    planetGrad.addColorStop(0, '#4a90e2');
    planetGrad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();

    // ship with glow
    const sx = planet.x + Math.cos(ship.angle) * ship.distance;
    const sy = planet.y + Math.sin(ship.angle) * ship.distance;
    ctx.save();
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 10;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.arc(sx, sy, ship.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // asteroids with subtle shadow
    asteroids.forEach(a => {
      const ax = planet.x + Math.cos(a.angle) * a.distance;
      const ay = planet.y + Math.sin(a.angle) * a.distance;
      ctx.save();
      ctx.shadowColor = '#888';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#95a5a6';
      ctx.beginPath();
      ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + lives, 10, 20);
    ctx.fillText('Score: ' + Math.floor(score), 10, 40);
  }

  let animId;
  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (lives > 0) animId = requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
