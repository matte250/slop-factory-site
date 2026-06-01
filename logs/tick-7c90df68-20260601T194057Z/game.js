// Endless Asteroid Dodger
// Canvas with id="game" must exist in the HTML.
// Ship rotates left/right (←/→) and thrusts forward (↑). Asteroids spawn randomly.
// Collision or fuel depletion ends the game. Score = distance traveled.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ==== Game state ====
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    fuel: 100,
    distance: 0,
  };
  const asteroids = [];
  // Generate starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      radius: rand(0.5, 1.5),
    });
  }
  const keys = {};
  let lastTime = 0;
  let gameOver = false;

  // ==== Input ====
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Start audio context on first interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp' && ship.fuel > 0) {
      // Thrust sound
      playSound(400, 0.05);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  // ==== Audio ====
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };

  // ==== Helper functions ====
  const rand = (min, max) => Math.random() * (max - min) + min;
  // Generate an irregular polygon for asteroid shape
  const generateAsteroidShape = (radius) => {
    const points = [];
    const sides = Math.floor(rand(7, 12));
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const r = radius * rand(0.7, 1.0);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return points;
  };
  const spawnAsteroid = () => {
    const edge = Math.floor(rand(0, 4)); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const speed = rand(0.5, 2);
    const angle = rand(0, Math.PI * 2);
    const radius = rand(15, 30);
    switch (edge) {
      case 0: x = rand(0, width); y = -20; break;
      case 1: x = width + 20; y = rand(0, height); break;
      case 2: x = rand(0, width); y = height + 20; break;
      case 3: x = -20; y = rand(0, height); break;
    }
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    // store shape points for drawing
    asteroids.push({ x, y, vx, vy, radius, shape: generateAsteroidShape(radius) });
  };

  const update = dt => {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= 3 * dt; // rotate 3 rad/s
    if (keys['ArrowRight']) ship.angle += 3 * dt;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel = Math.max(0, ship.fuel - 10 * dt); // fuel consumption
    }
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap around edges
    if (ship.x < 0) ship.x += width; else if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height; else if (ship.y > height) ship.y -= height;
    // Track distance
    ship.distance += Math.hypot(ship.vx, ship.vy) * dt;
    // Asteroids update
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -30) a.x += width + 60;
      else if (a.x > width + 30) a.x -= width + 60;
      if (a.y < -30) a.y += height + 60;
      else if (a.y > height + 30) a.y -= height + 60;
    });
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.radius + ship.radius) {
        gameOver = true;
        break;
      }
    }
    // Fuel depletion ends game
    if (ship.fuel <= 0) gameOver = true;
    // Periodic asteroid spawn
    if (Math.random() < 0.02) spawnAsteroid();
  };

  const draw = () => {
    // Fill background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship draw (triangle with gradient)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createLinearGradient(-12, -6, 12, 6);
    grad.addColorStop(0, '#ffdd33');
    grad.addColorStop(1, '#ff8800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids (irregular polygons)
    ctx.strokeStyle = '#888';
    ctx.fillStyle = '#555';
    asteroids.forEach(a => {
      ctx.beginPath();
      const shape = a.shape;
      if (shape && shape.length) {
        shape.forEach((pt, i) => {
          const x = a.x + pt.x;
          const y = a.y + pt.y;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // fallback circle
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(ship.distance)}` , 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  };

  const loop = timestamp => {
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Start
  requestAnimationFrame(loop);
})();
