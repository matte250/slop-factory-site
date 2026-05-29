// Simple Space Debris Dodge game
// Canvas id: "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Star field data
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      alpha: Math.random(),
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach((s) => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      // twinkle
      s.alpha += (Math.random() - 0.5) * 0.02;
      if (s.alpha < 0) s.alpha = 0;
      if (s.alpha > 1) s.alpha = 1;
    });
    ctx.globalAlpha = 1;
  }
  // Player ship (triangle shape)
  const ship = {
    x: width / 2,
    y: height - 60,
    size: 20,
    w: 20,
    h: 20,
    speed: 4,
  };

  // Game state
  let debris = [];
  let fuelCells = [];
  let fuel = 100; // seconds
  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  function spawnDebris() {
    const size = Math.random() * 20 + 10;
    debris.push({
      x: Math.random() * width,
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
    });
  }

  function spawnFuel() {
    const size = 15;
    fuelCells.push({
      x: Math.random() * width,
      y: -size,
      w: size,
      h: size,
      speed: 1.5,
    });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.y -= ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn debris periodically
    if (Math.random() < 0.02) spawnDebris();
    // Spawn fuel cells occasionally
    if (Math.random() < 0.005) spawnFuel();

    // Update debris
    debris.forEach((d) => (d.y += d.speed));
    debris = debris.filter((d) => d.y < height + d.h);

    // Update fuel cells
    fuelCells.forEach((f) => (f.y += f.speed));
    fuelCells = fuelCells.filter((f) => f.y < height + f.h);

    // Collision detection
    const rectCollision = (a, b) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    for (const d of debris) {
      if (rectCollision(ship, d)) {
        gameOver = true;
        // Play collision sound
        playTone(200, 0.3);
        break;
      }
    }
    if (gameOver) return;

    for (let i = fuelCells.length - 1; i >= 0; i--) {
      if (rectCollision(ship, fuelCells[i])) {
        fuel = Math.min(100, fuel + 20);
        fuelCells.splice(i, 1);
        // Play fuel collection sound
        playTone(800, 0.15);
      }
    }

    // Fuel consumption
    fuel -= dt * 0.01; // consume per millisecond
    if (fuel <= 0) {
      gameOver = true;
    }

    // Score based on time survived
    score += dt * 0.001;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
// Star field background (dark with twinkling stars)
      // Fill background with gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#000022');
      bgGrad.addColorStop(1, '#000011');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      // Draw stars
      drawStars();

    // Draw ship (green triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // Draw debris (rotating gray rocks)
    ctx.fillStyle = '#888';
    debris.forEach((d) => {
      ctx.save();
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(d.angle);
      ctx.beginPath();
      ctx.arc(0, 0, d.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // update rotation
      d.angle += d.rotSpeed;
    });

    // Draw fuel cells (orange stars)
    fuelCells.forEach((f) => {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      const cx = f.x + f.w / 2;
      const cy = f.y + f.h / 2;
      const r = f.w / 2;
      // start at top point
      ctx.moveTo(cx + r * Math.cos(-Math.PI / 2), cy + r * Math.sin(-Math.PI / 2));
      for (let i = 1; i < 5; i++) {
        const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, fuel).toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(score)}`, width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
