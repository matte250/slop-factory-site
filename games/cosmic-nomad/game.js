// Simple Cosmic Nomad game
// Canvas with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  const thrustCooldown = 100; // ms
  let lastThrust = 0;
  function playThrust(){
    const now = performance.now();
    if(now - lastThrust < thrustCooldown) return;
    lastThrust = now;
    playTone(400, 0.05);
  }
  function playPickup(){
    playTone(800, 0.1);
  }
  function playGameOver(){
    playTone(150, 0.5);
  }

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 8,
    angle: 0, // radians, facing up
    speed: 2,
    vx: 0,
    vy: 0,
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Entities
  const blackHoles = [];
  const pickups = [];
  const maxHoles = 5;
  const maxPickups = 2;

  function spawnBlackHole() {
    blackHoles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 12 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }
  function spawnPickup() {
    pickups.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 6,
    });
  }
  // initial spawns
  for (let i = 0; i < maxHoles; i++) spawnBlackHole();
  for (let i = 0; i < maxPickups; i++) spawnPickup();

  let gameOver = false;

  function update() {
    // ship controls
    const accel = 0.2;
    let accelerated = false;
    if (keys.ArrowUp) { ship.vy -= accel; accelerated = true; }
    if (keys.ArrowDown) { ship.vy += accel; accelerated = true; }
    if (keys.ArrowLeft) { ship.vx -= accel; accelerated = true; }
    if (keys.ArrowRight) { ship.vx += accel; accelerated = true; }
    if (accelerated) playThrust();
    // apply friction
    ship.vx *= 0.98;
    ship.vy *= 0.98;
    ship.x += ship.vx * ship.speed;
    ship.y += ship.vy * ship.speed;
    // keep within bounds
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;
    // move black holes
    blackHoles.forEach(h => {
      h.x += h.vx * 0.5;
      h.y += h.vy * 0.5;
      if (h.x < 0) h.x = width;
      if (h.x > width) h.x = 0;
      if (h.y < 0) h.y = height;
      if (h.y > height) h.y = 0;
    });
    // check collisions with holes
    for (const h of blackHoles) {
      const dx = ship.x - h.x, dy = ship.y - h.y;
        if (Math.hypot(dx, dy) < ship.radius + h.r) { gameOver = true; playGameOver(); break; }
    }
    if (gameOver) return;
    // check pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      const d = Math.hypot(ship.x - p.x, ship.y - p.y);
      if (d < ship.radius + p.r) {
        ship.speed = Math.min(ship.speed + 0.5, 5);
        pickups.splice(i, 1);
        // spawn a new one after short delay
        setTimeout(spawnPickup, 2000);
      }
    }
    // occasionally add new holes
    if (blackHoles.length < maxHoles && Math.random() < 0.005) spawnBlackHole();
  }

  function drawStarfield() {
    // dark space gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // twinkling stars with varying brightness
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const bright = Math.random();
      ctx.fillStyle = `rgba(255,255,255,${bright})`;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  function draw() {
    drawStarfield();
    // draw pickups
    pickups.forEach(p => {
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw black holes with radial gradient and glow
    blackHoles.forEach(h => {
      const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
      grad.addColorStop(0, '#222');
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      // subtle outer glow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
    });
    // draw ship with gradient hull and thrust
    function drawShip(){
      ctx.save();
      ctx.translate(ship.x, ship.y);
      const angle = Math.atan2(ship.vy, ship.vx) + Math.PI / 2;
      ctx.rotate(angle);
      // hull gradient
      const hullGrad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
      hullGrad.addColorStop(0, '#88f');
      hullGrad.addColorStop(1, '#44a');
      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(0, -ship.radius);
      ctx.lineTo(ship.radius * 0.7, ship.radius);
      ctx.lineTo(-ship.radius * 0.7, ship.radius);
      ctx.closePath();
      ctx.fill();
      // thrust flame when accelerating
      if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(0, ship.radius);
        ctx.lineTo(ship.radius * 0.3, ship.radius + ship.radius);
        ctx.lineTo(-ship.radius * 0.3, ship.radius + ship.radius);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';
      }
      ctx.restore();
    }
    drawShip();
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
