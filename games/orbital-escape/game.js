// Orbital Escape – simple canvas game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game objects
  const satellite = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.05,
    angle: 0,
  };

  const debris = [];
  const debrisCount = 5;
  const debrisSize = 20;
  const debrisSpeed = 1.5;

  let lastTime = 0;
  let elapsed = 0;
  let gameOver = false;

  // Helper functions
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnDebris() {
    for (let i = 0; i < debrisCount; i++) {
      const side = Math.floor(rand(0, 4));
      let x, y, vx, vy;
      // start from random edge
      if (side === 0) { // left
        x = -debrisSize; y = rand(0, height); vx = debrisSpeed; vy = rand(-0.5, 0.5);
      } else if (side === 1) { // right
        x = width + debrisSize; y = rand(0, height); vx = -debrisSpeed; vy = rand(-0.5, 0.5);
      } else if (side === 2) { // top
        x = rand(0, width); y = -debrisSize; vx = rand(-0.5, 0.5); vy = debrisSpeed;
      } else { // bottom
        x = rand(0, width); y = height + debrisSize; vx = rand(-0.5, 0.5); vy = -debrisSpeed;
      }
      // each debris gets a rotation angle and speed
      const angle = rand(0, Math.PI * 2);
      const rotSpeed = rand(-0.02, 0.02);
      debris.push({ x, y, vx, vy, size: debrisSize, angle, rotSpeed });
    }
  }

  function update(dt) {
    // Controls – Arrow keys apply thrust in respective direction
    if (keys['ArrowUp']) satellite.vy -= satellite.thrust;
    if (keys['ArrowDown']) satellite.vy += satellite.thrust;
    if (keys['ArrowLeft']) satellite.vx -= satellite.thrust;
    if (keys['ArrowRight']) satellite.vx += satellite.thrust;

    // Simple friction
    satellite.vx *= 0.99;
    satellite.vy *= 0.99;

    // Update satellite orientation based on velocity direction
    if (satellite.vx !== 0 || satellite.vy !== 0) {
      satellite.angle = Math.atan2(satellite.vy, satellite.vx) + Math.PI / 2;
    }

    // Update position
    satellite.x += satellite.vx * dt;
    satellite.y += satellite.vy * dt;

    // Keep satellite within bounds (wrap around)
    if (satellite.x < 0) satellite.x = width;
    if (satellite.x > width) satellite.x = 0;
    if (satellite.y < 0) satellite.y = height;
    if (satellite.y > height) satellite.y = 0;

    // Update debris – movement and rotation
    debris.forEach(d => {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.angle !== undefined && d.rotSpeed !== undefined) {
        d.angle += d.rotSpeed * dt;
      }
    });

    // Collision detection
    for (const d of debris) {
      const dx = d.x - satellite.x;
      const dy = d.y - satellite.y;
      const dist = Math.hypot(dx, dy);
      if (dist < satellite.radius + d.size / 2) {
        gameOver = true;
        // play collision sound
        playTone(150, 'triangle', 0.2);
        break;
      }
    }
  }

// Render the current frame with enhanced visuals
function draw() {
  ctx.clearRect(0, 0, width, height);

  // ---- Background: dark gradient with twinkling stars ----
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001d2a');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  // stars – random tiny circles with slight opacity variation
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) {
    const sx = rand(0, width);
    const sy = rand(0, height);
    ctx.globalAlpha = rand(0.3, 0.9);
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.globalAlpha = 1;

  // ---- Planet: radial gradient for a glowing effect ----
  const planetGrad = ctx.createRadialGradient(width / 2, height / 2, 30, width / 2, height / 2, 80);
  planetGrad.addColorStop(0, '#2a8b57');
  planetGrad.addColorStop(1, '#0a3d1a');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
  ctx.fill();

  // ---- Satellite: body with subtle glow and thrust flame ----
  // body
  ctx.save();
  ctx.translate(satellite.x, satellite.y);
  ctx.rotate(satellite.angle);
  const satGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, satellite.radius);
  satGrad.addColorStop(0, '#ffea00');
  satGrad.addColorStop(1, '#ff8c00');
  ctx.fillStyle = satGrad;
  ctx.beginPath();
  ctx.arc(0, 0, satellite.radius, 0, Math.PI * 2);
  ctx.fill();
  // thrust flame when any thrust key is pressed
  if (keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']) {
    ctx.fillStyle = 'rgba(255,150,0,0.7)';
    ctx.beginPath();
    ctx.moveTo(0, satellite.radius);
    ctx.lineTo(-satellite.radius / 2, satellite.radius + 12);
    ctx.lineTo(satellite.radius / 2, satellite.radius + 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ---- Debris: rotating squares with shading ----
  ctx.fillStyle = '#ff4444';
  debris.forEach(d => {
    ctx.save();
    ctx.translate(d.x, d.y);
    const angle = d.angle || 0;
    ctx.rotate(angle);
    ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
    ctx.restore();
  });

  // ---- UI: survival time ----
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Time: ${ (elapsed / 1000).toFixed(1) }s`, 10, 20);

  // ---- Game Over overlay ----
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff4444';
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
      elapsed += delta;
      update(delta / 16); // normalize roughly to 60fps steps
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Input handling
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    if (!keys[e.key]) {
      // play thrust sound on initial press
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        playTone(300, 'sawtooth', 0.08);
      }
    }
    keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Initialise
  spawnDebris();
  requestAnimationFrame(loop);
})();
