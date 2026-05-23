// Minimalist Canvas Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  const center = { x: width / 2, y: height / 2 };

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('mousedown', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playSpawnSound() { playTone(400, 0.05); }
  function playCollisionSound() { playTone(150, 0.3); }


  // Game objects
  const sat = { x: center.x, y: center.y, r: 5, vx: 0, vy: 0 };
  const asteroids = [];
  let safeRadius = Math.min(width, height) / 3;
  const shrinkPerSec = 12; // pixels per second
  let lastTime = 0;
  let spawnTimer = 0;
  let running = true;
  let elapsed = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  let dragging = false;
  canvas.addEventListener('mousedown', e => { dragging = true; updateMousePos(e); });
  canvas.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('mousemove', e => { if (dragging) updateMousePos(e); });
  function updateMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    sat.x = e.clientX - rect.left;
    sat.y = e.clientY - rect.top;
  }

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(width, height) / 2;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    asteroids.push({ x, y, r: 8 });
    playSpawnSound();
  }

  function update(dt) {
    // movement via arrow keys
    const speed = 150; // px/s
    if (keys['ArrowUp']) sat.y -= speed * dt;
    if (keys['ArrowDown']) sat.y += speed * dt;
    if (keys['ArrowLeft']) sat.x -= speed * dt;
    if (keys['ArrowRight']) sat.x += speed * dt;

    // keep satellite inside canvas bounds
    sat.x = Math.max(0, Math.min(width, sat.x));
    sat.y = Math.max(0, Math.min(height, sat.y));

    // shrink safe zone
    safeRadius = Math.max(20, safeRadius - shrinkPerSec * dt);

    // spawn asteroids every 2 seconds
    spawnTimer += dt;
    if (spawnTimer > 2) { spawnTimer = 0; spawnAsteroid(); }

    // collision detection
    const distFromCenter = Math.hypot(sat.x - center.x, sat.y - center.y);
    if (distFromCenter > safeRadius) { playCollisionSound(); running = false; }
    for (const a of asteroids) {
      const d = Math.hypot(sat.x - a.x, sat.y - a.y);
      if (d < sat.r + a.r) { playCollisionSound(); running = false; break; }
    }
  }

  function draw() {
    // Background: dark space with subtle stars
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#001020');
    bgGradient.addColorStop(1, '#000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const sr = Math.random() * 1.5;
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx, sy, sr, sr);
    }
    // Safe zone with radial gradient
    const safeGrad = ctx.createRadialGradient(center.x, center.y, safeRadius * 0.8, center.x, center.y, safeRadius);
    safeGrad.addColorStop(0, 'rgba(0,255,0,0.2)');
    safeGrad.addColorStop(1, 'rgba(0,255,0,0.0)');
    ctx.fillStyle = safeGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, safeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Asteroids with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff8c8c');
      grad.addColorStop(1, '#b30000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset
    // Satellite with glossy effect
    const satGrad = ctx.createRadialGradient(sat.x, sat.y, sat.r * 0.2, sat.x, sat.y, sat.r);
    satGrad.addColorStop(0, '#66aaff');
    satGrad.addColorStop(1, '#0044aa');
    ctx.fillStyle = satGrad;
    ctx.beginPath();
    ctx.arc(sat.x, sat.y, sat.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Timer
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${elapsed.toFixed(1)}s`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Survived ${elapsed.toFixed(1)} seconds`, width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    if (running) {
      elapsed += dt;
      update(dt);
    }
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
