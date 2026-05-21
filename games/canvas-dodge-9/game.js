// Simple Canvas Dodge game with improved graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ==== Audio setup ====
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // ==== Background stars ====
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // ==== Player ship ====
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 15,
    speed: 3,
    dx: 0,
    dy: 0,
  };

  // Input handling (unlock audio on first interaction)
  const keys = {};
  let audioUnlocked = false;
  window.addEventListener('keydown', e => {
    if (!audioUnlocked) { audioCtx.resume(); audioUnlocked = true; }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updateShip() {
    ship.dx = ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));
  }

  // ==== Asteroids (with rotation) ====
  const asteroids = [];
  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy, angle, rotSpeed;
    // spawn from random edge
    if (side === 0) { // left
      x = -size; y = Math.random() * height; vx = Math.random() * 2 + 1; vy = (Math.random() - 0.5) * 2;
    } else if (side === 1) { // right
      x = width + size; y = Math.random() * height; vx = -(Math.random() * 2 + 1); vy = (Math.random() - 0.5) * 2;
    } else if (side === 2) { // top
      x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * 2; vy = Math.random() * 2 + 1;
    } else { // bottom
      x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * 2; vy = -(Math.random() * 2 + 1);
    }
    angle = Math.random() * Math.PI * 2;
    rotSpeed = (Math.random() - 0.5) * 0.04; // slow rotation
    asteroids.push({ x, y, vx, vy, size, angle, rotSpeed });
  }
  // spawn periodically
  setInterval(spawnAsteroid, 1000);

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rotSpeed;
      // remove off‑screen
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
      }
    }
  }

  function collides() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.size) return true;
    }
    return false;
  }

  let startTime = performance.now();
  let gameOver = false;

  function draw() {
    // dark space background
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, width, height);

    // draw stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship (triangle with stroke)
    ctx.fillStyle = '#00ffff';
    ctx.strokeStyle = '#004444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // asteroids (gradient fill)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.size * 0.2,
        a.x, a.y, a.size
      );
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      updateShip();
      updateAsteroids();
      if (collides()) {
        // play explosion sound
        playBeep(80, 0.3);
        gameOver = true;
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
