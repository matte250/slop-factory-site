// Simple Space Debris Defender game
// Canvas with id="game" expected in the HTML page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  const CENTER = { x: W / 2, y: H / 2 };

  // Game constants
  const EARTH_R = 50;
  const SAT_R = 8;
  const DEBRIS_R = 6;
  const SAFE_ALTITUDE = 100; // min radius from earth centre
  const START_ALTITUDE = 150; // initial radius
  const GRAVITY = 0.001; // orbital decay per frame
  const THRUST = 0.2; // radial thrust per key press
  const SPAWN_INTERVAL = 2000; // ms
  const STAR_COUNT = 120;
  const stars = Array.from({length: STAR_COUNT}, () => ({ x: Math.random() * W, y: Math.random() * H }));

  // Game state
  let radius = START_ALTITUDE;
  let angle = 0;
  let angularSpeed = 0.02; // rad per frame
  let debris = [];
  let lastSpawn = 0;
  let score = 0;
  let running = true;

  // Input handling and sound setup
  const keys = { ArrowLeft: false, ArrowRight: false };
  // Audio context (lazy init on first interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInit = false;
  function initAudio(){ if (!audioInit){ if (audioCtx.state === 'suspended') audioCtx.resume(); audioInit = true; } }
  function beep(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function collisionSound(){ beep(150, 0.4); }
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      initAudio();
      // thrust sound
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') beep(400, 0.08);
    }
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnDebris() {
    const dAngle = Math.random() * Math.PI * 2;
    const dRadius = SAFE_ALTITUDE + Math.random() * (START_ALTITUDE - SAFE_ALTITUDE);
    debris.push({ angle: dAngle, radius: dRadius });
  }

  function update(dt) {
    // Thrust controls: left/right adjust radius (inward/outward)
    if (keys.ArrowLeft) radius = Math.max(SAFE_ALTITUDE, radius - THRUST);
    if (keys.ArrowRight) radius = Math.min(START_ALTITUDE + 100, radius + THRUST);

    // Simple orbital decay
    radius -= GRAVITY * radius;
    angle += angularSpeed;

    // Update debris (they rotate with same angular speed for simplicity)
    debris.forEach(d => d.angle += angularSpeed);

    // Collision detection
    const satX = CENTER.x + radius * Math.cos(angle);
    const satY = CENTER.y + radius * Math.sin(angle);
    for (const d of debris) {
      const dx = satX - (CENTER.x + d.radius * Math.cos(d.angle));
      const dy = satY - (CENTER.y + d.radius * Math.sin(d.angle));
        if (Math.hypot(dx, dy) < SAT_R + DEBRIS_R) {
          running = false; // game over
          collisionSound();
          break;
        }
    }

    // Lose if below safe altitude
    if (radius < SAFE_ALTITUDE) running = false;

    // Score
    if (running) score += dt / 1000;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    stars.forEach(st => {
      ctx.fillRect(st.x, st.y, 1, 1);
    });
    // Earth with gradient and glow
    const earthGrad = ctx.createRadialGradient(CENTER.x, CENTER.y, EARTH_R * 0.3, CENTER.x, CENTER.y, EARTH_R);
    earthGrad.addColorStop(0, '#3a7bd5');
    earthGrad.addColorStop(1, '#0c1e3e');
    ctx.shadowColor = '#3a7bd5';
    ctx.shadowBlur = 15;
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, EARTH_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Satellite
    const satX = CENTER.x + radius * Math.cos(angle);
    const satY = CENTER.y + radius * Math.sin(angle);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(satX, satY, SAT_R, 0, Math.PI * 2);
    ctx.fill();
    // Debris with radial gradient
    const debrisGrad = ctx.createRadialGradient(0,0,0,0,0,DEBRIS_R);
    debrisGrad.addColorStop(0,'#ff8c00');
    debrisGrad.addColorStop(1,'#b22222');
    debris.forEach(d => {
      const x = CENTER.x + d.radius * Math.cos(d.angle);
      const y = CENTER.y + d.radius * Math.sin(d.angle);
      ctx.fillStyle = debrisGrad;
      ctx.beginPath();
      ctx.arc(x, y, DEBRIS_R, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      if (timestamp - lastSpawn > SPAWN_INTERVAL) {
        spawnDebris();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  let lastTime = 0;
  requestAnimationFrame(loop);
})();
