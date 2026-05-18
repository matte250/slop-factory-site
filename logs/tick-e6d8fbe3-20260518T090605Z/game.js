// Asteroid Dodge Game – concise implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill its container (optional)
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Create background stars for a richer space feel
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playThrust(){
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = {osc, gain};
  }
  function stopThrust(){
    if (!thrustOsc) return;
    thrustOsc.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustOsc.osc.stop(audioCtx.currentTime + 0.1);
    thrustOsc = null;
  }
  function playCollision(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  function playGameOver(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(50, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      if (e.key === 'ArrowUp') playThrust();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) {
      keys[e.key] = false;
      if (e.key === 'ArrowUp') stopThrust();
    }
  });

  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    turnSpeed: 0.06,
    drag: 0.99,
  };

  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms

  let lastSpawn = 0;
  let score = 0;
  let startTime = null;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    // Spawn just outside canvas on a random side
    if (side === 0) { x = -radius; y = Math.random() * canvas.height; }
    else if (side === 1) { x = canvas.width + radius; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = -radius; }
    else { x = Math.random() * canvas.width; y = canvas.height + radius; }
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const speed = 0.5 + Math.random() * 1.0;
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius });
  }

  function update(dt) {
    // Ship rotation
    if (keys.ArrowLeft) ship.angle -= ship.turnSpeed;
    if (keys.ArrowRight) ship.angle += ship.turnSpeed;
    // Thrust
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Apply drag and move
    ship.vx *= ship.drag;
    ship.vy *= ship.drag;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;
    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.radius || a.x > canvas.width + a.radius || a.y < -a.radius || a.y > canvas.height + a.radius) {
        asteroids.splice(i, 1);
      }
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        // Collision sound and game over cue
        playCollision();
        playGameOver();
        gameOver = true;
        break;
      }
    }
    // Score based on elapsed time
    if (!gameOver && startTime !== null) score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  function draw() {
    // Dark space gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // slight movement for depth effect
      s.x += (Math.random() - 0.5) * 0.2;
      s.y += (Math.random() - 0.5) * 0.2;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;
    }

    // Ship – draw as triangle with glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0; // reset

    // Asteroids – circles with rough edges
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#777';
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - (lastTime || timestamp)) / 16; // normalize to ~60fps units
    lastTime = timestamp;
    if (!gameOver) {
      if (timestamp - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
