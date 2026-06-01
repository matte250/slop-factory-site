// game.js - Simple Pixel Dodger
// Canvas with id "game" assumed in HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player ship
  const ship = { x: width / 2 - 10, y: height - 30, size: 20, speed: 4, shield: 0 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Game objects
  const asteroids = [];
  const powerUps = [];
  let lastAsteroid = 0;
  let lastPower = 0;
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;
  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function spawnAsteroid() {
    const size = 15 + Math.random() * 15;
    asteroids.push({ x: Math.random() * (width - size), y: -size, size, speed: 2 + Math.random() * 2 });
    playSound(120, 0.08); // asteroid spawn beep
  }

  function spawnPower() {
    const size = 12;
    powerUps.push({ x: Math.random() * (width - size), y: -size, size, speed: 2 });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside bounds
    ship.x = Math.max(0, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.size, ship.y));

    // Spawn asteroids every 800ms
    if (performance.now() - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = performance.now(); }
    // Spawn power‑up every 8000ms
    if (performance.now() - lastPower > 8000) { spawnPower(); lastPower = performance.now(); }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) asteroids.splice(i, 1);
    }
    // Update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y > height) powerUps.splice(i, 1);
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (rectIntersect(ship, a)) {
        if (ship.shield > 0) {
          // destroy asteroid, consume shield
          asteroids.splice(i, 1);
          ship.shield--;
        } else {
          playSound(200, 0.3); // collision beep
          gameOver = true;
        }
        break;
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
        if (rectIntersect(ship, p)) {
          ship.shield = 3; // grant 3‑frame shield
          playSound(400, 0.15); // power‑up beep
          powerUps.splice(i, 1);
          break;
        }
    }

    // Score based on survival time
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
  }

  function draw() {
    // background: dark space with tiny stars
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);
    drawStarfield();

    // ship as triangle, colored cyan when shielded
    ctx.fillStyle = ship.shield > 0 ? '#00ffff' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.size / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // asteroids as radial gradient circles
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2, a.y + a.size / 2, a.size * 0.2,
        a.x + a.size / 2, a.y + a.size / 2, a.size / 2
      );
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // power‑ups as rotating stars
    ctx.fillStyle = '#ffdd00';
    powerUps.forEach(p => {
      const cx = p.x + p.size / 2;
      const cy = p.y + p.size / 2;
      const spikes = 5;
      const outer = p.size / 2;
      const inner = outer / 2.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(performance.now() / 500);
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / spikes;
        ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // score
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    // shield indicator
    if (ship.shield > 0) {
      ctx.fillText('Shield: ' + ship.shield, 10, 40);
    }
  }

// helper: simple moving starfield
const starfield = [];
for (let i = 0; i < 100; i++) {
  starfield.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
}
function drawStarfield() {
  ctx.fillStyle = '#ffffff';
  starfield.forEach(s => {
    ctx.fillRect(s.x, s.y, s.size, s.size);
    s.y += s.speed;
    if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
  });
}

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillStyle = 'white';
      ctx.fillText('Final Score: ' + score, width / 2 - 70, height / 2 + 30);
      return;
    }
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
