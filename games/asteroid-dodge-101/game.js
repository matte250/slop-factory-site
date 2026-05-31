// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  let audioCtx;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  const playSound = (freq, dur) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur / 1000);
    osc.start(now);
    osc.stop(now + dur / 1000);
  };
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Ship definition
  const ship = {
    width: 60,
    height: 20,
    x: width / 2 - 30,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Input handling
  window.addEventListener('keydown', (e) => {
    initAudio();
    if (e.key === 'ArrowLeft') {
      ship.moveLeft = true;
      playSound(200, 50); // low tone for movement
    }
    if (e.key === 'ArrowRight') {
      ship.moveRight = true;
      playSound(250, 50);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  // Asteroid handling
  const asteroids = [];
  const stars = [];
  const STAR_COUNT = 100;
  // generate stars for background
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  let spawnTimer = 0;
  let spawnInterval = 1000; // ms
  let lastTime = 0;
  let speedMultiplier = 1;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (width - radius * 2) + radius;
    const y = -radius;
    const speed = 2 + Math.random() * 2; // base speed
    const angle = Math.random() * Math.PI * 2; // initial rotation
    const spin = (Math.random() - 0.5) * 0.02; // rotation speed
    asteroids.push({ x, y, radius, speed, angle, spin });
    playSound(400, 80); // asteroid spawn tone
  }

  function update(delta) {
    // Move ship
    if (ship.moveLeft) ship.x -= ship.speed;
    if (ship.moveRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // Spawn asteroids over time
    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      spawnAsteroid();
      spawnTimer = 0;
    }

    // Increase difficulty gradually
    speedMultiplier += delta * 0.00001; // tiny increase per ms

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * speedMultiplier;
      // rotate asteroid
      a.angle += a.spin * delta;
      // Remove off‑screen asteroids
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision detection with ship (simple AABB vs circle)
      const shipRect = {
        left: ship.x,
        right: ship.x + ship.width,
        top: ship.y,
        bottom: ship.y + ship.height,
      };
      const nearestX = Math.max(shipRect.left, Math.min(a.x, shipRect.right));
      const nearestY = Math.max(shipRect.top, Math.min(a.y, shipRect.bottom));
      const dx = a.x - nearestX;
      const dy = a.y - nearestY;
      if (dx * dx + dy * dy < a.radius * a.radius) {
        playSound(100, 200); // collision impact
        gameOver = true;
      }
    }
  }

function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(st => {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.width, ship.y + ship.height);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#007');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw rotating asteroids with radial gradient
    asteroids.forEach((a) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });


    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(delta);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
