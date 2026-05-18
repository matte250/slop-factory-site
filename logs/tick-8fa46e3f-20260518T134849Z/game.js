// Orbit Runner – simple canvas game
// Canvas with id "game" must exist in the HTML.

(() => {
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to its CSS size or fallback
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  const { width, height } = canvas;

  // ----- Starfield -----
  const stars = [];
  const starCount = 200;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 20 + 10,
    });
  }

  function updateStars(dt) {
    for (const s of stars) {
      s.y += s.speed * dt;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
  }

  // ----- Game state -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 12,
  };

  const asteroids = [];
  const fuels = [];
  let fuel = 100; // starts full, drains per second
  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- Input -----
  const keys = {};
  // Ensure audio context is running after user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Entity creation -----
  const spawnAsteroid = () => {
    const side = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    const speed = rand(30, 80);
    switch (side) {
      case 0: pos.x = rand(0, width); pos.y = -20; vel.x = rand(-1, 1); vel.y = speed; break;
      case 1: pos.x = width + 20; pos.y = rand(0, height); vel.x = -speed; vel.y = rand(-1, 1); break;
      case 2: pos.x = rand(0, width); pos.y = height + 20; vel.x = rand(-1, 1); vel.y = -speed; break;
      case 3: pos.x = -20; pos.y = rand(0, height); vel.x = speed; vel.y = rand(-1, 1); break;
    }
    asteroids.push({ x: pos.x, y: pos.y, vx: vel.x, vy: vel.y, r: rand(15, 30) });
  };

  const spawnFuel = () => {
    const x = rand(30, width - 30);
    const y = rand(30, height - 30);
    fuels.push({ x, y, r: 8, collected: false });
  };

  // ----- Game loop -----
  function update(dt) {
    if (gameOver) return;

    // Input handling – rotate & thrust
    if (keys.ArrowLeft) ship.angle -= 3 * dt; // 3 rad/s
    if (keys.ArrowRight) ship.angle += 3 * dt;
    if (keys.ArrowUp) {
      const thrust = 200; // px/s²
      ship.vx += Math.cos(ship.angle) * thrust * dt;
      ship.vy += Math.sin(ship.angle) * thrust * dt;
    }

    // Apply velocity and friction
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.vx *= 0.99; // simple damping
    ship.vy *= 0.99;

    // Keep ship inside canvas (wrap)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // remove if far outside
      if (a.x < -100 || a.x > width + 100 || a.y < -100 || a.y > height + 100) {
        asteroids.splice(i, 1);
      }
    }

    // Update stars (background)
    updateStars(dt);

    // Update fuels (no movement)
    // Collision detection – ship with asteroids
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.r) {
        // play crash sound
        playTone(150, 0.4);
        gameOver = true;
        break;
      }
    }

    // Ship with fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (!f.collected && dist(ship, f) < ship.radius + f.r) {
        fuel = Math.min(100, fuel + 30);
        f.collected = true;
        fuels.splice(i, 1);
      }
    }

    // Fuel consumption & score
    fuel -= 10 * dt; // per second
    score += dt * 10; // points per second
    if (fuel <= 0) gameOver = true;

    // Spawn logic
    if (Math.random() < dt * 0.5) spawnAsteroid(); // avg 0.5 per second
    if (Math.random() < dt * 0.1) spawnFuel(); // avg 0.1 per second
  }
    if (gameOver) return;

    // Input handling – rotate & thrust
    if (keys.ArrowLeft) ship.angle -= 3 * dt; // 3 rad/s
    if (keys.ArrowRight) ship.angle += 3 * dt;
    if (keys.ArrowUp) {
      const thrust = 200; // px/s²
      ship.vx += Math.cos(ship.angle) * thrust * dt;
      ship.vy += Math.sin(ship.angle) * thrust * dt;
    }

    // Apply velocity and friction
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.vx *= 0.99; // simple damping
    ship.vy *= 0.99;

    // Keep ship inside canvas (wrap)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // remove if far outside
      if (a.x < -100 || a.x > width + 100 || a.y < -100 || a.y > height + 100) {
        asteroids.splice(i, 1);
      }
    }

    // Update fuels (no movement)
    // Collision detection – ship with asteroids
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.r) {
        // play crash sound
        playTone(150, 0.4);
        gameOver = true;
        break;
      }
    }

    // Ship with fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (!f.collected && dist(ship, f) < ship.radius + f.r) {
        fuel = Math.min(100, fuel + 30);
        f.collected = true;
        fuels.splice(i, 1);
      }
    }

    // Fuel consumption & score
    fuel -= 10 * dt; // per second
    score += dt * 10; // points per second
    if (fuel <= 0) gameOver = true;

    // Spawn logic
    if (Math.random() < dt * 0.5) spawnAsteroid(); // avg 0.5 per second
    if (Math.random() < dt * 0.1) spawnFuel(); // avg 0.1 per second
  }

  function draw() {
    // Clear background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship – triangle with gradient
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, 0, ship.x, ship.y, ship.radius);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#004');
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids – gray with subtle stroke
    ctx.fillStyle = '#555';
    ctx.strokeStyle = '#222';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw fuels – glowing yellow
    for (const f of fuels) {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f33';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(score)}`, width / 2, height / 2 + 20);
    }
  }
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw ship – triangle
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw fuels
    ctx.fillStyle = '#ff0';
    for (const f of fuels) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f33';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(score)}`, width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Kick‑off
  requestAnimationFrame(loop);
})();
