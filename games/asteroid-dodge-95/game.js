// Simple Asteroid Dodge game with enhanced graphics (stars, gradients, explosions)
// Canvas element with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
   const ctx = canvas.getContext('2d');
   // Audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let audioStarted = false;
   let thrustOsc = null;
   function startThrustSound() {
     if (thrustOsc) return;
     thrustOsc = audioCtx.createOscillator();
     thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
     const gain = audioCtx.createGain();
     gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
     thrustOsc.connect(gain).connect(audioCtx.destination);
     thrustOsc.start();
   }
   function stopThrustSound() {
     if (!thrustOsc) return;
     thrustOsc.stop();
     thrustOsc.disconnect();
     thrustOsc = null;
   }
   function playExplosionSound() {
     const osc = audioCtx.createOscillator();
     osc.frequency.setValueAtTime(80, audioCtx.currentTime);
     const gain = audioCtx.createGain();
     gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
     osc.connect(gain).connect(audioCtx.destination);
     osc.start();
     osc.stop(audioCtx.currentTime + 0.2);
   }
   // Set canvas size to fill its container
   canvas.width = canvas.clientWidth || 800;
   canvas.height = canvas.clientHeight || 600;
   // Generate star field for background
   const stars = [];
   for (let i = 0; i < 100; i++) {
     stars.push({
       x: Math.random() * canvas.width,
       y: Math.random() * canvas.height,
       r: Math.random() * 1.5 + 0.5,
     });
   }
   // Explosion particles pool
   let explosions = [];

  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
    maxSpeed: 4,
  };

  const asteroids = [];
  const maxAsteroids = 5;
  const spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let collisions = 0;
  const maxCollisions = 3;
  let gameOver = false;

  // Helper functions
  const random = (min, max) => Math.random() * (max - min) + min;

  function spawnAsteroid() {
    const size = random(15, 30);
    const side = Math.floor(random(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    if (side === 0) { // top
      x = random(0, canvas.width);
      y = -size;
      vx = random(-0.5, 0.5);
      vy = random(0.5, 1.5);
    } else if (side === 1) { // right
      x = canvas.width + size;
      y = random(0, canvas.height);
      vx = random(-1.5, -0.5);
      vy = random(-0.5, 0.5);
    } else if (side === 2) { // bottom
      x = random(0, canvas.width);
      y = canvas.height + size;
      vx = random(-0.5, 0.5);
      vy = random(-1.5, -0.5);
    } else { // left
      x = -size;
      y = random(0, canvas.height);
      vx = random(0.5, 1.5);
      vy = random(-0.5, 0.5);
    }
    asteroids.push({ x, y, vx, vy, radius: size });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

function update(dt) {
    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    // Thrust
    if (keys['ArrowUp']) {
      // Play thrust sound on first press
      if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
      startThrustSound();
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      const speed = Math.hypot(ship.vx, ship.vy);
      if (speed > ship.maxSpeed) {
        ship.vx *= ship.maxSpeed / speed;
        ship.vy *= ship.maxSpeed / speed;
      }
    } else {
      // Stop thrust sound when not pressing up
      stopThrustSound();
    }
    // Move ship (wrap around edges)
    ship.x = (ship.x + ship.vx * dt) % canvas.width;
    ship.y = (ship.y + ship.vy * dt) % canvas.height;
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.y < 0) ship.y += canvas.height;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Remove if off-screen
      if (a.x < -a.radius || a.x > canvas.width + a.radius || a.y < -a.radius || a.y > canvas.height + a.radius) {
        asteroids.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      const p = explosions[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life--;
      if (p.life <= 0) explosions.splice(i, 1);
    }

    // Spawn new asteroids
    if (Date.now() - lastSpawn > spawnInterval && asteroids.length < maxAsteroids) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        collisions++;
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          explosions.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30,
          });
        }
        // Play explosion sound
        playExplosionSound();
        // Reset ship position and velocity
        ship.x = canvas.width / 2;
        ship.y = canvas.height / 2;
        ship.vx = ship.vy = 0;
        if (collisions >= maxCollisions) {
          gameOver = true;
        }
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001020');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw star field
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
    // Draw thrust flame when accelerating
    if (keys['ArrowUp']) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-22, -6);
      ctx.lineTo(-22, 6);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
      ctx.restore();
    }

    // Draw asteroids
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Collisions: ${collisions}/${maxCollisions}`, 10, 20);
    // Draw explosions
    for (const p of explosions) {
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 16; // scale to ~60fps units
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
