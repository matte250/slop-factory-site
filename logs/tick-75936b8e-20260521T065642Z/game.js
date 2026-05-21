// Simple Orbit Escape game
// Canvas element with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match displayed size
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Pre-generate background stars for a richer space backdrop
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }

  // Game state
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    angle: 0,
    speed: 0,
    fuel: 100,
    maxFuel: 100,
  };
  const asteroids = [];
  const fuelCells = [];
  const asteroidCount = 8;
  const fuelCellCount = 3;

  // Initialize asteroids on circular orbits around center
  for (let i = 0; i < asteroidCount; i++) {
    const distance = 80 + Math.random() * 150;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.001 + Math.random() * 0.003; // rad per ms
    const radius = 12 + Math.random() * 8;
    asteroids.push({distance, angle, speed, radius});
  }

  // Initialize fuel cells at random positions
  for (let i = 0; i < fuelCellCount; i++) {
    fuelCells.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 8,
      collected: false,
    });
  }

  // Input handling
  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 200) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(400, 'triangle', 80); }
  function playFuel() { playTone(800, 'triangle', 150); }
  function playCollision() { playTone(200, 'sawtooth', 500); }
  // Ensure audio context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', e => {keys[e.code] = true; resumeAudio(); if (e.code === 'ArrowUp' || e.code === 'KeyW') playThrust(); if (e.code === 'ArrowDown' || e.code === 'KeyS') playThrust();});
  window.addEventListener('keyup', e => {keys[e.code] = false;});
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - ship.x;
    const dy = my - ship.y;
    ship.angle = Math.atan2(dy, dx);
  });

  function update(dt) {
    // Fuel consumption
    ship.fuel -= dt * 0.02; // fuel per ms
    if (ship.fuel < 0) ship.fuel = 0;

    // Controls
    if (keys['ArrowUp'] || keys['KeyW']) ship.speed = 0.12;
    else if (keys['ArrowDown'] || keys['KeyS']) ship.speed = -0.06;
    else ship.speed = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= 0.003 * dt;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += 0.003 * dt;

    // Move ship
    ship.x += Math.cos(ship.angle) * ship.speed * dt;
    ship.y += Math.sin(ship.angle) * ship.speed * dt;

    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids positions
    asteroids.forEach(a => {
      a.angle += a.speed * dt;
      a.x = width / 2 + Math.cos(a.angle) * a.distance;
      a.y = height / 2 + Math.sin(a.angle) * a.distance;
    });

    // Check collisions with asteroids
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        endGame('Collision');
        return;
      }
    }

    // Check fuel cells
    for (const f of fuelCells) {
      if (f.collected) continue;
      const dx = ship.x - f.x;
      const dy = ship.y - f.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + f.radius) {
        f.collected = true;
        ship.fuel = Math.min(ship.maxFuel, ship.fuel + 30);
        playFuel();
      }
    }

    // Lose condition: out of fuel
    if (ship.fuel <= 0) {
      endGame('Out of fuel');
    }
  }

  let lastTime = performance.now();
  let gameOver = false;
  function endGame(reason) {
    gameOver = true;
    // Play collision sound if caused by collision
    if (reason === 'Collision') playCollision();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over: ' + reason, width / 2, height / 2);
  }

  function draw() {
    // Space background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw fuel gauge with gradient
    const gaugeGrad = ctx.createLinearGradient(10, 10, 10 + 100, 10);
    gaugeGrad.addColorStop(0, '#00ff00');
    gaugeGrad.addColorStop(1, '#006400');
    ctx.fillStyle = gaugeGrad;
    const barWidth = 100;
    const barHeight = 10;
    const fuelRatio = ship.fuel / ship.maxFuel;
    ctx.fillRect(10, 10, barWidth * fuelRatio, barHeight);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 10, barWidth, barHeight);

    // Draw ship (triangle) with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // glow effect
    ctx.shadowColor = 'rgba(0,255,255,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaaaaa');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw fuel cells with a subtle glow
    fuelCells.forEach(f => {
      if (f.collected) return;
      ctx.shadowColor = 'rgba(255,165,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
