// Asteroid Cat game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const ship = { x: width / 2, y: height / 2, size: 20, speed: 2, fuel: 100 };
  const keys = {};
  const asteroids = [];
  const fish = [];
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Input handling
  // Ensure AudioContext is running after user interaction
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 15 + Math.random() * 25;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy, angle, rotSpeed;
    // Random initial rotation and speed
    angle = Math.random() * Math.PI * 2;
    rotSpeed = (Math.random() - 0.5) * 0.02;
    if (side === 0) { x = -size; y = Math.random() * height; vx = 1 + Math.random() * 1; vy = (Math.random() - 0.5) * 1; }
    else if (side === 1) { x = width + size; y = Math.random() * height; vx = -1 - Math.random() * 1; vy = (Math.random() - 0.5) * 1; }
    else if (side === 2) { x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * 1; vy = 1 + Math.random() * 1; }
    else { x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * 1; vy = -1 - Math.random() * 1; }
    asteroids.push({ x, y, vx, vy, size, angle, rotSpeed });
  }

  function spawnFish() {
    const size = 10;
    const x = Math.random() * (width - size);
    const y = Math.random() * (height - size);
    fish.push({ x, y, size, collected: false });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));
    // Fuel consumption
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) ship.fuel = 0;

    // Spawn entities
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.01) spawnFish();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // Remove if off screen
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.size + ship.size) {
        gameOver = true;
        playTone(200, 0.3); // collision sound
      }
    }

    // Check fish collection
    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i];
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
      if (Math.hypot(dx, dy) < f.size + ship.size) {
        score += 10;
        ship.fuel = Math.min(100, ship.fuel + 10);
        fish.splice(i, 1);
        playTone(600, 0.2); // fish collected sound
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#00172d');
    bgGrad.addColorStop(1, '#003366');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ship (cat silhouette with ears)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.fillStyle = '#ff8c00'; // orange
    ctx.beginPath();
    // body
    ctx.arc(0, 0, ship.size, 0, Math.PI * 2);
    // ears
    ctx.moveTo(-ship.size * 0.6, -ship.size * 0.6);
    ctx.lineTo(-ship.size * 0.3, -ship.size * 1.2);
    ctx.lineTo(0, -ship.size * 0.6);
    ctx.moveTo(ship.size * 0.6, -ship.size * 0.6);
    ctx.lineTo(ship.size * 0.3, -ship.size * 1.2);
    ctx.lineTo(0, -ship.size * 0.6);
    ctx.fill();
    ctx.restore();

    // Asteroids with rotation
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // update rotation for next frame
      a.angle += a.rotSpeed;
    });

    // Fish (collectibles) as small stars
    ctx.fillStyle = '#ffd700';
    fish.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.beginPath();
      const r = f.size;
      // start at top point
      ctx.moveTo(0, -r);
      for (let i = 1; i < 5; i++) {
        const theta = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // Start the game
  requestAnimationFrame(loop);
})();
