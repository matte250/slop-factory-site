// Game implementation for the canvas with id="game"
// Based on IDEA.md: simple ship, asteroids, fuel cells, lose on collision or out of fuel.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Adjust canvas size to fill parent
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  const ship = {
    x: 50,
    y: canvas.height / 2,
    width: 20,
    height: 15,
    speed: 4,
    fuel: 100,
    fuelConsumption: 0.03,
  };

  const asteroids = [];
  const fuels = [];

  let gameOver = false;
  let frame = 0;
  let asteroidSpawnRate = 120; // frames
  let fuelSpawnRate = 300;
  let baseSpeed = 2;

  // Input handling (arrow keys)
  const keys = { ArrowUp: false, ArrowDown: false };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustTimeout = null;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function startThrustSound() {
    if (thrustTimeout) return;
    playTone(200, 200);
    thrustTimeout = setInterval(() => playTone(200, 150), 250);
  }
  function stopThrustSound() {
    clearInterval(thrustTimeout);
    thrustTimeout = null;
  }
  function playExplosion() {
    playTone(80, 400);
  }
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      // resume audio context on first interaction
      if (audioCtx.state === 'suspended') audioCtx.resume();
      startThrustSound();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) {
      keys[e.key] = false;
      // stop thrust if no arrow keys pressed
      if (!keys.ArrowUp && !keys.ArrowDown) stopThrustSound();
    }
  });
  // Mouse move – vertical only
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
  });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: canvas.width + size,
      y: Math.random() * (canvas.height - size),
      size,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    });
  }

  function spawnFuel() {
    const radius = 10;
    fuels.push({
      x: canvas.width + radius,
      y: Math.random() * (canvas.height - radius * 2) + radius,
      radius,
    });
  }

  function update() {
  // move stars for parallax effect
  stars.forEach(st => {
    st.x -= st.speed;
    if (st.x < 0) {
      st.x = canvas.width;
      st.y = Math.random() * canvas.height;
    }
  });
    if (gameOver) return;
    frame++;
    // ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));
    // fuel consumption
    ship.fuel -= ship.fuelConsumption;
    if (ship.fuel <= 0) ship.fuel = 0;
    // increase speed over time
    const speed = baseSpeed + frame * 0.0005;
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= speed;
      a.angle += a.rotSpeed;
      // collision with ship (simple AABB vs point)
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.width > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.height > a.y
      ) {
        gameOver = true;
        playExplosion();
      }
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }
    // spawn asteroids
    if (frame % asteroidSpawnRate === 0) spawnAsteroid();

    // update fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= speed;
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
      if (Math.hypot(dx, dy) < f.radius + Math.max(ship.width, ship.height) / 2) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        fuels.splice(i, 1);
      } else if (f.x + f.radius < 0) {
        fuels.splice(i, 1);
      }
    }
    if (frame % fuelSpawnRate === 0) spawnFuel();
    if (ship.fuel <= 0) gameOver = true;
  }

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001122');
  bgGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // starfield (twinkling with slight opacity variation)
  ctx.fillStyle = 'white';
  stars.forEach(st => {
    ctx.globalAlpha = 0.5 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;
  // ship (triangle with gradient)
  const shipGrad = ctx.createLinearGradient(
    ship.x - ship.width,
    ship.y - ship.height / 2,
    ship.x,
    ship.y + ship.height / 2
  );
  shipGrad.addColorStop(0, '#00ffff');
  shipGrad.addColorStop(1, '#0066ff');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x - ship.width, ship.y - ship.height / 2);
  ctx.lineTo(ship.x - ship.width, ship.y + ship.height / 2);
  ctx.closePath();
  ctx.fill();
  // thruster flame when moving
  if (keys.ArrowUp || keys.ArrowDown) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(ship.x - ship.width, ship.y);
    ctx.lineTo(ship.x - ship.width - 10, ship.y - 5);
    ctx.lineTo(ship.x - ship.width - 10, ship.y + 5);
    ctx.closePath();
    ctx.fill();
  }
// asteroids with rotation and gradient
  asteroids.forEach(a => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    const grad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size / 2);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
    // fuel cells
    ctx.fillStyle = 'yellow';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel gauge
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + Math.round(ship.fuel), 10, 20);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
