// Asteroid Escape game
// Canvas with id="game" must exist in the HTML.
// Arrow keys move the ship (triangle). Asteroids spawn and drift.
// Ship has 3 lives; collision reduces a life. Game ends when lives reach 0.
// Score = time survived (seconds).

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur/1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur/1000);
  }
  let lastThrust = 0;
  // generate simple starfield for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: -Math.PI/2, // radians, pointing up
    speed: 3,
    radius: 10,
    lives: 3,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // ensure audio context is running after first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const asteroids = [];
  const particles = []; // explosion particles
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const asteroidSpeed = 2;
  const asteroidRadius = 15;

  const startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    // assign random rotation
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.02; // radians per frame
    // spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    switch (side) {
      case 0: // top
        x = Math.random() * width;
        y = -asteroidRadius;
        vx = (Math.random() - 0.5) * asteroidSpeed;
        vy = asteroidSpeed;
        break;
      case 1: // right
        x = width + asteroidRadius;
        y = Math.random() * height;
        vx = -asteroidSpeed;
        vy = (Math.random() - 0.5) * asteroidSpeed;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + asteroidRadius;
        vx = (Math.random() - 0.5) * asteroidSpeed;
        vy = -asteroidSpeed;
        break;
      case 3: // left
        x = -asteroidRadius;
        y = Math.random() * height;
        vx = asteroidSpeed;
        vy = (Math.random() - 0.5) * asteroidSpeed;
        break;
    }
    asteroids.push({ x, y, vx, vy, radius: asteroidRadius });
  }

  function update(dt) {
    if (gameOver) return;
    // rotate ship
    if (keys.ArrowLeft) ship.angle -= 0.05;
    if (keys.ArrowRight) ship.angle += 0.05;
    // move ship forward/backward
    if (keys.ArrowUp) {
      ship.x += Math.cos(ship.angle) * ship.speed;
      ship.y += Math.sin(ship.angle) * ship.speed;
      // play thrust sound, throttled
      if (performance.now() - lastThrust > 100) {
        playBeep(600, 80);
        lastThrust = performance.now();
      }
    }
    if (keys.ArrowDown) {
      ship.x -= Math.cos(ship.angle) * ship.speed * 0.5;
      ship.y -= Math.sin(ship.angle) * ship.speed * 0.5;
    }
    // keep ship within bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -asteroidRadius || a.x > width + asteroidRadius || a.y < -asteroidRadius || a.y > height + asteroidRadius) {
        asteroids.splice(i, 1);
      }
    }
    // collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        ship.lives--;
        // collision sound
        playBeep(200, 200);
        asteroids.splice(i, 1);
        if (ship.lives <= 0) {
          // game over sound
          playBeep(100, 500);
          gameOver = true;
        }
      }
    }
  }

  function draw() {
    // draw gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#000814');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  // draw stars
  ctx.fillStyle = 'white';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
    // draw ship (triangle with stroke)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // draw asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI: lives and score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + ship.lives, 10, 20);
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText('Score: ' + seconds, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
