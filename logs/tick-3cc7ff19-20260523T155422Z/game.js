// Orbital Escape game implementation
// Canvas element with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
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
  };

  // Adjust canvas size to fill its display size
  const stars = [];
const generateStars = () => {
  const count = Math.floor((canvas.width * canvas.height) / 8000);
  stars.length = 0;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
};
const resize = () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Recenter planet
  planet.x = canvas.width / 2;
  planet.y = canvas.height / 2;
  generateStars();
};
resize();
window.addEventListener('resize', resize);

  // Game constants
  const planet = { x: canvas.width / 2, y: canvas.height / 2, r: 30, color: '#3b82f6' };
  const satellite = {
    r: 5,
    angle: 0,
    distance: 80,
    angularVel: 0.02,
    color: '#fbbf24',
  };
  const orbRadius = 4;
  const orbs = [];
  let score = 0;
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;

  // Input handling (arrow keys)
  const keys = {};
  // Ensure audio context resumes on interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // Adjust angular velocity with left/right arrows
    if (keys['ArrowLeft']) satellite.angularVel -= 0.0005 * dt;
    if (keys['ArrowRight']) satellite.angularVel += 0.0005 * dt;

    // Adjust orbit distance with up/down arrows
    if (keys['ArrowUp']) satellite.distance += 0.05 * dt; // move outward
    if (keys['ArrowDown']) satellite.distance -= 0.05 * dt; // move inward

    // Update satellite position
    satellite.angle += satellite.angularVel * dt;

    // Keep angle in [0, 2π]
    if (satellite.angle > Math.PI * 2) satellite.angle -= Math.PI * 2;
    if (satellite.angle < 0) satellite.angle += Math.PI * 2;

    // Lose conditions
    const minDist = planet.r + satellite.r;
    const maxDist = Math.min(canvas.width, canvas.height) / 2 - satellite.r;
    if (satellite.distance <= minDist || satellite.distance >= maxDist) {
      // Play crash sound
      playTone(200, 0.3);
      // Reset game after short delay to let sound play
      setTimeout(() => {
        alert('Game over! Score: ' + score);
        reset();
      }, 300);
      return;
    }

    // Spawn orbs
    const now = performance.now();
    if (now - lastSpawn > spawnInterval) {
      spawnOrb();
      lastSpawn = now;
    }

    // Check collisions with orbs
    const satX = planet.x + Math.cos(satellite.angle) * satellite.distance;
    const satY = planet.y + Math.sin(satellite.angle) * satellite.distance;
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = satX - o.x;
      const dy = satY - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < satellite.r + orbRadius) {
        // Collect
        orbs.splice(i, 1);
        score++;
        // Play collect sound
        playTone(800, 0.1);
        // Increase difficulty
        satellite.angularVel *= 1.05;
        spawnInterval = Math.max(500, spawnInterval - 50);
      }
    }
  }

  function spawnOrb() {
    // Random position within canvas but outside planet radius
    let x, y;
    do {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
    } while (Math.hypot(x - planet.x, y - planet.y) < planet.r + 20);
    orbs.push({ x, y });
  }

  function draw() {
    // Background
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw planet with gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x,
      planet.y,
      planet.r * 0.2,
      planet.x,
      planet.y,
      planet.r
    );
    planetGrad.addColorStop(0, '#5b84ff');
    planetGrad.addColorStop(1, '#1e3a8a');
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fillStyle = planetGrad;
    ctx.fill();

    // Draw orbs with glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#10b981';
    for (const o of orbs) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, orbRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw satellite with gradient and slight glow
    const satX = planet.x + Math.cos(satellite.angle) * satellite.distance;
    const satY = planet.y + Math.sin(satellite.angle) * satellite.distance;
    const satGrad = ctx.createRadialGradient(
      satX,
      satY,
      satellite.r * 0.2,
      satX,
      satY,
      satellite.r
    );
    satGrad.addColorStop(0, '#fde047');
    satGrad.addColorStop(1, '#f59e0b');
    ctx.beginPath();
    ctx.arc(satX, satY, satellite.r, 0, Math.PI * 2);
    ctx.fillStyle = satGrad;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#fbbf24';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function reset() {
    satellite.angle = 0;
    satellite.distance = 80;
    satellite.angularVel = 0.02;
    orbs.length = 0;
    score = 0;
    spawnInterval = 2000;
    lastSpawn = performance.now();
  }

  reset();
  requestAnimationFrame(loop);
})();
