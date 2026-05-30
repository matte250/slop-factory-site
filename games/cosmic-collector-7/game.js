// game.js – simple Cosmic Collector implementation
// Targets <canvas id="game"></canvas> present in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 100) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playLaser = () => playTone(800, 80);
  const playExplosion = () => playTone(150, 200);
  const playCollect = () => playTone(1200, 120);
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const ship = { x: 50, y: height / 2, w: 30, h: 20, speed: 4, shield: 0 };
  let score = 0;
  let fuel = 100; // percent, decreases over time
  const asteroids = [];
  const orbs = [];
  const lasers = [];
  // starfield for background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    speed: 0.5 + Math.random() * 0.5
  }));
  let lastAsteroid = 0;
  let lastOrb = 0;
  let lastFire = 0;

  // ----- Helpers -----
  const rectCollides = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const spawnAsteroid = () => {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width, y: Math.random() * (height - size), w: size, h: size, speed: 2 + Math.random() * 2 });
  };

  const spawnOrb = () => {
    const size = 15;
    orbs.push({ x: width, y: Math.random() * (height - size), w: size, h: size, speed: 2 });
  };

  const fireLaser = () => {
    lasers.push({ x: ship.x + ship.w, y: ship.y + ship.h / 2 - 2, w: 10, h: 4, speed: 6 });
    playLaser();
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Main loop -----
  function loop(timestamp) {
    // update
    if (keys.ArrowUp) ship.y = Math.max(0, ship.y - ship.speed);
    if (keys.ArrowDown) ship.y = Math.min(height - ship.h, ship.y + ship.speed);
    if (keys.Space && timestamp - lastFire > 200) { fireLaser(); lastFire = timestamp; }

    // move asteroids
    asteroids.forEach(a => a.x -= a.speed);
    // move orbs
    orbs.forEach(o => o.x -= o.speed);
    // move lasers
    lasers.forEach(l => l.x += l.speed);
    // move stars (background)
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
    });
    // collision detection
    asteroids.forEach((a, i) => {
      if (rectCollides(a, ship)) {
        if (ship.shield > 0) {
          ship.shield = 0; // shield broken
          asteroids.splice(i, 1);
        } else {
          // game over
          alert('Game Over! Score: ' + score);
          document.location.reload();
        }
      }
      // laser hits asteroid
      lasers.forEach((l, li) => {
        if (rectCollides(l, a)) {
          asteroids.splice(i, 1);
          lasers.splice(li, 1);
          playExplosion();
        }
      });
    });

    orbs.forEach((o, i) => {
      if (rectCollides(o, ship)) {
        score += 10;
        ship.shield = 200; // frames of shield
        orbs.splice(i, 1);
        playCollect();
      }
    });

    // clean up off‑screen objects
    asteroids.filter(a => a.x + a.w > 0);
    orbs.filter(o => o.x + o.w > 0);
    lasers.filter(l => l.x < width);

    // spawn new entities
    if (timestamp - lastAsteroid > 1500) { spawnAsteroid(); lastAsteroid = timestamp; }
    if (timestamp - lastOrb > 3000) { spawnOrb(); lastOrb = timestamp; }

    // shield timer
    if (ship.shield > 0) ship.shield--;

    // fuel consumption
    fuel -= 0.02;
    if (fuel <= 0) { alert('Out of fuel! Score: ' + score); document.location.reload(); }

    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars – tiny luminous points
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    });
    // ship – draw as triangle with gradient hull
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, ship.shield > 0 ? '#00ffff' : '#ffffff');
    shipGrad.addColorStop(1, ship.shield > 0 ? '#0066ff' : '#777777');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids – draw as circles with simple gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.1, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // orbs – glowing radial circles
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w*0.2, o.x + o.w/2, o.y + o.h/2, o.w/2);
      orbGrad.addColorStop(0, '#ffff66');
      orbGrad.addColorStop(1, '#ff9900');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // lasers – thin bright lines
    ctx.strokeStyle = 'rgba(255,0,0,0.9)';
    ctx.lineWidth = 2;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y + l.h/2);
      ctx.lineTo(l.x + l.w, l.y + l.h/2);
      ctx.stroke();
    });
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Fuel: ' + Math.floor(fuel) + '%', 10, 40);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
