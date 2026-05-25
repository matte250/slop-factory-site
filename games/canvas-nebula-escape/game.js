// Simple Canvas Nebula Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // audio context (initialized on first user interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });
  // simple tone generator
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // ambient nebula hum
  const ambientId = setInterval(() => playTone(150, 0.3), 4000);
  const width = canvas.width;
  const height = canvas.height;

  // --- Game objects ---
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 12,
    speed: 2,
    vx: 0,
    vy: 0,
    fuel: 100, // percent
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  const clouds = [];
  const crystals = [];

  // Populate clouds (static obstacles) and crystals (collectibles)
  const cloudCount = 30;
  for (let i = 0; i < cloudCount; i++) {
    clouds.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 20 + Math.random() * 30,
    });
  }

  // starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const crystalCount = 15;
  for (let i = 0; i < crystalCount; i++) {
    crystals.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 6,
      collected: false,
    });
  }

  // --- Input handling ---
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function update() {
    // fuel consumption
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) ship.fuel = 0;

    // movement based on keys
    ship.vx = ship.vy = 0;
    if (keys.ArrowUp) ship.vy = -ship.speed;
    if (keys.ArrowDown) ship.vy = ship.speed;
    if (keys.ArrowLeft) ship.vx = -ship.speed;
    if (keys.ArrowRight) ship.vx = ship.speed;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // keep inside bounds
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // check crystal collection
    for (const c of crystals) {
      if (!c.collected && dist(ship, c) < ship.radius + c.radius) {
        c.collected = true;
        ship.speed += 0.3; // gain speed
        ship.fuel = Math.min(100, ship.fuel + 10); // small fuel boost
        playTone(800, 0.1); // crystal collection sound
      }
    }

    // collision with clouds -> game over
    for (const cl of clouds) {
      if (dist(ship, cl) < ship.radius + cl.radius) {
        gameOver();
        return;
      }
    }

    // win condition could be all crystals collected (optional)
    if (crystals.every(c => c.collected)) {
      // restart with new set
      crystals.forEach(c => { c.collected = false; c.x = Math.random() * width; c.y = Math.random() * height; });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // starfield background
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw nebula clouds with radial gradient for depth
    for (const cl of clouds) {
      const grad = ctx.createRadialGradient(cl.x, cl.y, cl.radius * 0.2, cl.x, cl.y, cl.radius);
      grad.addColorStop(0, 'rgba(180,120,255,0.6)');
      grad.addColorStop(1, 'rgba(100,50,150,0.1)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, cl.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw crystals
    ctx.fillStyle = 'gold';
    for (const c of crystals) {
      if (c.collected) continue;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw ship with simple triangle and glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.atan2(ship.vy, ship.vx) || 0);
    // glow
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-ship.radius, -ship.radius * 0.6);
    ctx.lineTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // fuel bar
    ctx.fillStyle = 'lime';
    ctx.fillRect(10, 10, ship.fuel, 8);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(10, 10, 100, 8);
  }

  function loop() {
    update();
    draw();
    if (!gameEnded) requestAnimationFrame(loop);
  }

  let gameEnded = false;
  function gameOver() {
    gameEnded = true;
    // stop ambient sound
    clearInterval(ambientId);
    // explosion sound
    playTone(200, 0.5);
    ctx.fillStyle = 'red';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  // utility distance
  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  // start the loop
  requestAnimationFrame(loop);
})();
