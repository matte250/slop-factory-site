// Orbital Dodge game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  };
  const playSpawn = () => playTone(200, 80);
  const playCollision = () => playTone(500, 200);
  // Ensure audio context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  const cx = width / 2;
  const cy = height / 2;

  const orbitRadius = Math.min(width, height) * 0.3;
  const shipRadius = 5;
  const asteroidRadius = 8;
  const shipSpeed = 0.03; // radians per frame
  let shipAngle = 0;
  let direction = 0; // -1 left, 1 right

  const asteroids = [];
  const spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let running = true;

  // Input handling
  const onKey = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') direction = -1;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') direction = 1;
  };
  const onKeyUp = e => {
    if (['ArrowLeft','a','A','ArrowRight','d','D'].includes(e.key)) direction = 0;
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);

  const spawnAsteroid = () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = orbitRadius + 50 + Math.random() * 100; // start outside orbit
    const speed = 0.5 + Math.random() * 1.0; // pixels per frame
    asteroids.push({angle, distance, speed});
    playSpawn();
  };

  const update = (dt) => {
    // rotate ship
    shipAngle += direction * shipSpeed;
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.distance -= a.speed;
      if (a.distance < 0) { asteroids.splice(i, 1); continue; }
      // collision check
      const ax = cx + Math.cos(a.angle) * a.distance;
      const ay = cy + Math.sin(a.angle) * a.distance;
      const sx = cx + Math.cos(shipAngle) * orbitRadius;
      const sy = cy + Math.sin(shipAngle) * orbitRadius;
      const dx = ax - sx;
      const dy = ay - sy;
      if (Math.hypot(dx, dy) < shipRadius + asteroidRadius) {
        running = false;
        break;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // orbit - faint dashed line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(200,200,200,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // background stars (drawn earlier each frame)
    // ship - simple triangle with gradient
    const shipX = cx + Math.cos(shipAngle) * orbitRadius;
    const shipY = cy + Math.sin(shipAngle) * orbitRadius;
    const shipGrad = ctx.createRadialGradient(shipX, shipY, 0, shipX, shipY, shipRadius * 3);
    shipGrad.addColorStop(0, '#aaffaa');
    shipGrad.addColorStop(1, '#004400');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    const tipX = shipX + Math.cos(shipAngle) * shipRadius * 2;
    const tipY = shipY + Math.sin(shipAngle) * shipRadius * 2;
    const leftX = shipX + Math.cos(shipAngle + Math.PI * 0.8) * shipRadius;
    const leftY = shipY + Math.sin(shipAngle + Math.PI * 0.8) * shipRadius;
    const rightX = shipX + Math.cos(shipAngle - Math.PI * 0.8) * shipRadius;
    const rightY = shipY + Math.sin(shipAngle - Math.PI * 0.8) * shipRadius;
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    // asteroids - rotating circles with gradient
    for (const a of asteroids) {
      const ax = cx + Math.cos(a.angle) * a.distance;
      const ay = cy + Math.sin(a.angle) * a.distance;
      const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, asteroidRadius * 2);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#660000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ax, ay, asteroidRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    // game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', cx, cy);
    }
  };

  const loop = (timestamp) => {
    if (!running) { draw(); return; }
    if (!lastSpawn) lastSpawn = timestamp;
    if (timestamp - lastSpawn > spawnInterval) { spawnAsteroid(); lastSpawn = timestamp; }
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
