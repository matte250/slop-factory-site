// Minimal Solar Drift game implementation
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  const center = { x: width / 2, y: height / 2 };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust() { playTone(300, 0.05); }
  function playExplosion() { playTone(100, 0.3); }
  function playSpawn() { playTone(600, 0.02); }


  // Ship parameters
  const shipRadius = 10;
  const orbitRadius = Math.min(width, height) * 0.3;
  let angle = 0;
  let angularSpeed = 0.001; // radians per ms

  // Meteoroid parameters
  const meteors = [];
  const meteorRadius = 8;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnMeteor() {
    // Random edge position
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 0.1 + Math.random() * 0.2; // px per ms
    if (edge === 0) { // top
      x = Math.random() * width; y = -meteorRadius; vx = (Math.random() - 0.5) * speed; vy = speed;
    } else if (edge === 1) { // right
      x = width + meteorRadius; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed;
    } else if (edge === 2) { // bottom
      x = Math.random() * width; y = height + meteorRadius; vx = (Math.random() - 0.5) * speed; vy = -speed;
    } else { // left
      x = -meteorRadius; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed;
    }
    meteors.push({ x, y, vx, vy, r: meteorRadius });
    playSpawn();
  }

  function update(dt) {
    // Adjust speed
    if (keys['ArrowUp']) angularSpeed += 0.00005 * dt;
    if (keys['ArrowDown']) angularSpeed -= 0.00005 * dt;
    angularSpeed = Math.max(0, angularSpeed);
    angle += angularSpeed * dt;
    // Play thrust sound while accelerating
    if (keys['ArrowUp']) playThrust();

    // Spawn meteors
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      // Remove off‑screen
      if (m.x < -50 || m.x > width + 50 || m.y < -50 || m.y > height + 50) {
        meteors.splice(i, 1);
        continue;
      }
      // Collision detection
      const sx = center.x + orbitRadius * Math.cos(angle);
      const sy = center.y + orbitRadius * Math.sin(angle);
      const dx = m.x - sx;
      const dy = m.y - sy;
      const distSq = dx * dx + dy * dy;
      const radSum = shipRadius + m.r;
      if (distSq < radSum * radSum) {
        running = false; // Game over
        playExplosion();
      }
    }
  }

  function draw() {
ctx.clearRect(0, 0, width, height);
  // Background stars
  const bgGradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, Math.max(width, height) / 2);
  bgGradient.addColorStop(0, '#001d3d');
  bgGradient.addColorStop(1, '#000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  // Small twinkling stars (draw once)
  if (!ctx._starField) {
    ctx._starField = [];
    for (let i = 0; i < 200; i++) {
      ctx._starField.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 });
    }
  }
  ctx.fillStyle = 'white';
  ctx._starField.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
  // Star (sun) with gradient
  const sunGrad = ctx.createRadialGradient(center.x, center.y, 5, center.x, center.y, 20);
  sunGrad.addColorStop(0, '#ffdd55');
  sunGrad.addColorStop(1, '#ff8800');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 20, 0, Math.PI * 2);
  ctx.fill();
  // Ship (triangle with gradient)
  const shipX = center.x + orbitRadius * Math.cos(angle);
  const shipY = center.y + orbitRadius * Math.sin(angle);
  const shipAngle = angle + Math.PI / 2; // point outward
  const shipSize = shipRadius * 2;
  // Gradient for ship body
  const shipGrad = ctx.createLinearGradient(shipX - shipSize, shipY - shipSize, shipX + shipSize, shipY + shipSize);
  shipGrad.addColorStop(0, '#00ffff');
  shipGrad.addColorStop(1, '#0066ff');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(shipX + Math.cos(shipAngle) * shipSize, shipY + Math.sin(shipAngle) * shipSize);
  ctx.lineTo(shipX + Math.cos(shipAngle + 2.5) * shipSize, shipY + Math.sin(shipAngle + 2.5) * shipSize);
  ctx.lineTo(shipX + Math.cos(shipAngle - 2.5) * shipSize, shipY + Math.sin(shipAngle - 2.5) * shipSize);
  ctx.closePath();
  ctx.fill();
  // Thrust flame when accelerating
  if (keys['ArrowUp']) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(shipX - Math.cos(shipAngle) * 4, shipY - Math.sin(shipAngle) * 4);
    ctx.lineTo(shipX - Math.cos(shipAngle + 1) * 12, shipY - Math.sin(shipAngle + 1) * 12);
    ctx.lineTo(shipX - Math.cos(shipAngle - 1) * 12, shipY - Math.sin(shipAngle - 1) * 12);
    ctx.closePath();
    ctx.fill();
  }
    // Meteors
    ctx.fillStyle = 'gray';
    meteors.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!running) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
