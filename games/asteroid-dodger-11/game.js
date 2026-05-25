// Simple Asteroid Dodger game
// Assumes an existing <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game objects
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    draw() {
      ctx.fillStyle = '#0af';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  };

  const asteroids = [];
  const fuels = [];
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
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
  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 2
    });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2
    });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Move asteroids
    asteroids.forEach(a => a.y += a.speed);
    fuels.forEach(f => f.y += f.speed);

    // Remove off‑screen
    asteroids.filter(a => a.y > height);
    fuels.filter(f => f.y > height);

    // Collision detection
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      if (rectIntersect(ship, a)) {
        gameOver = true;
        break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (rectIntersect(ship, f)) {
        score += 10;
        fuels.splice(i, 1);
      }
    }
  }

  function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ship.draw();
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => ctx.fillRect(a.x, a.y, a.w, a.h));
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => ctx.fillRect(f.x, f.y, f.w, f.h));
    ctx.fillStyle = '#000';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let frame = 0;
  function loop() {
    if (!gameOver) {
      if (frame % 60 === 0) spawnAsteroid(); // roughly one per second
      if (frame % 300 === 0) spawnFuel(); // every 5 seconds
    }
    update();
    draw();
    frame++;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
