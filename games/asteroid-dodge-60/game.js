// Simple Asteroid Dodge game targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
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
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  }

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    radius: 10,
    thrust: false,
    vx: 0,
    vy: 0,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  // Starfield
  const stars = [];
  const numStars = 120;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    // spawn from random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = Math.random() * 1.5 + 0.5;
    if (edge === 0) { // left
      x = -size; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed;
    } else if (edge === 1) { // top
      x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * speed; vy = speed;
    } else if (edge === 2) { // right
      x = width + size; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed;
    } else { // bottom
      x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * speed; vy = -speed;
    }
    asteroids.push({x, y, vx, vy, radius: size});
  }

  function update(dt) {
    if (gameOver) return;
    // Ship controls
    const thrustNow = keys['ArrowUp'] || keys['KeyW'];
    ship.thrust = thrustNow;
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= 0.07;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += 0.07;

    // Manage thrust sound
    if (thrustNow) {
      startThrustSound();
    } else {
      stopThrustSound();
    }

    if (ship.thrust) {
      const accel = 0.1;
      ship.vx += Math.cos(ship.angle) * accel;
      ship.vy += Math.sin(ship.angle) * accel;
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Asteroids
    const now = performance.now();
    if (now - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove if off-screen
      if (a.x < -a.radius || a.x > width + a.radius || a.y < -a.radius || a.y > height + a.radius) {
        asteroids.splice(i, 1);
        score++;
        continue;
      }
      // collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
        if (dist < a.radius + ship.radius) {
          // Play explosion sound on collision
          playExplosionSound();
          // Ensure thrust sound stops
          stopThrustSound();
          gameOver = true;
          break;
        }
    }
  }

  function draw() {
    // Space background
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#00f';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (ship.thrust) {
      const grad = ctx.createRadialGradient(-18, 0, 2, -18, 0, 10);
      grad.addColorStop(0, 'orange');
      grad.addColorStop(1, 'rgba(255,140,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
