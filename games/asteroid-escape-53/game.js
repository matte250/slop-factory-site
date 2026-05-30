// Asteroid Escape game
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const startThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.type = 'sawtooth';
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  };
  const playCollision = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };
  let collisionPlayed = false;

  // Resize canvas to fill the window.
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Re‑initialize stars for the new size
    initStars(200);
  };
  // Starfield
  let stars = [];
  const initStars = (count) => {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        // slight twinkle speed
        twinkle: Math.random() * 0.02 + 0.01,
        opacity: Math.random() * 0.5 + 0.5,
        size: Math.random() * 2 + 0.5,
      });
    }
  };
  initStars(200);
  resize();
  window.addEventListener('resize', resize);

  // Ship definition
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    speed: 4,
    vx: 0,
    vy: 0,
    angle: 0, // orientation in radians
  };

  // Game state
  let asteroids = [];
  let score = 0;
  let fuel = 100; // percent
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms
  const fuelDrainRate = 0.02; // percent per frame
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    // Choose a random edge
    const edge = Math.floor(Math.random() * 4); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 2; // 1-3 pixels per frame
    const radius = 15 + Math.random() * 20; // 15-35
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -radius;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // right
        x = canvas.width + radius;
        y = Math.random() * canvas.height;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + radius;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      case 3: // left
        x = -radius;
        y = Math.random() * canvas.height;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    asteroids.push({ x, y, vx, vy, radius });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship movement
    ship.vx = 0;
    ship.vy = 0;
    const moving = keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'] || keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d'];
    if (keys['ArrowUp'] || keys['w']) ship.vy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.vy = ship.speed;
    if (keys['ArrowLeft'] || keys['a']) ship.vx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.vx = ship.speed;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Thrust sound
    if (moving) {
      audioCtx.resume();
      startThrust();
    } else {
      stopThrust();
    }
    // Rotate ship to face movement direction
    if (ship.vx !== 0 || ship.vy !== 0) {
      ship.angle = Math.atan2(ship.vy, ship.vx) + Math.PI / 2;
    }
    // Keep ship within bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // Fuel drain
    fuel -= fuelDrainRate * dt;
    if (fuel <= 0) fuel = 0;

    // Spawn asteroids
    const now = performance.now();
    if (now - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Check collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const distSq = dx * dx + dy * dy;
      const radSum = a.radius + ship.radius;
      if (distSq < radSum * radSum) {
        if (!collisionPlayed) {
          playCollision();
          collisionPlayed = true;
        }
        gameOver = true;
      }
      // Remove asteroid if it leaves the screen and award a point
      if (
        a.x < -a.radius || a.x > canvas.width + a.radius ||
        a.y < -a.radius || a.y > canvas.height + a.radius
      ) {
        asteroids.splice(i, 1);
        if (!gameOver) score++;
      }
    }

    // End game if out of fuel
    if (fuel <= 0) gameOver = true;
  }

  function draw() {
    // Background: stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars with twinkle
    stars.forEach(s => {
      // Update opacity for twinkle effect
      s.opacity += s.twinkle;
      if (s.opacity > 1 || s.opacity < 0.3) {
        s.twinkle = -s.twinkle;
      }
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, s.size, s.size);
      ctx.globalAlpha = 1;
    });

    // Ship (triangle pointing up)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.7, ship.radius);
    ctx.lineTo(-ship.radius * 0.7, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI – score and fuel bar
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 20, 30);

    // Fuel bar background
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 40;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    // Fuel level
    ctx.fillStyle = fuel > 20 ? '#0f0' : '#f00';
    ctx.fillRect(barX, barY, (fuel / 100) * barWidth, barHeight);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
