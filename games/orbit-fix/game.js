// Simple Orbit Fix game implementation with improved graphics
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function startAudio(){
    if (!audioStarted && audioCtx.state !== 'running'){
      audioCtx.resume();
      audioStarted = true;
    }
  }
  // Simple beep helper using oscillator
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Create a simple star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Game constants
  const STATION_RADIUS = Math.min(width, height) * 0.35;
  const DRONE_SIZE = 12;
  const DEBRIS_COUNT = 8;
  const MODULE_COUNT = 12;
  const PRESSURE_INCREASE = 0.02; // per frame per leaking module
  const PRESSURE_MAX = 100;

  // State
  let pressure = 0;
  let score = 0;
  let over = false;
  const drone = { x: width / 2, y: height / 2, vx: 0, vy: 0, speed: 3 };
  const keys = {};

  // Modules positioned on the station's circumference
  const modules = [];
  for (let i = 0; i < MODULE_COUNT; i++) {
    const angle = (i / MODULE_COUNT) * Math.PI * 2;
    modules.push({ angle, leaking: Math.random() < 0.3, repaired: false });
  }

  // Debris objects move linearly across the canvas
  const debris = [];
  for (let i = 0; i < DEBRIS_COUNT; i++) {
    const d = {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      r: 6,
    };
    debris.push(d);
  }

  // Input handling
  window.addEventListener('keydown', (e) => { keys[e.key] = true; startAudio(); });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });
  canvas.addEventListener('click', (e) => {
    startAudio();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Check each leaking module
    modules.forEach((m) => {
      if (!m.leaking) return;
      const px = width / 2 + Math.cos(m.angle) * STATION_RADIUS;
      const py = height / 2 + Math.sin(m.angle) * STATION_RADIUS;
      const dx = mx - px;
      const dy = my - py;
      if (dx * dx + dy * dy < 15 * 15) {
        m.leaking = false;
        m.repaired = true;
        score++;
        // Play repair sound
        playBeep(440, 150);
      }
    });
  });

  function update() {
    if (over) return;
    // Drone movement
    drone.vx = 0; drone.vy = 0;
    if (keys['ArrowLeft'] || keys['a']) drone.vx = -drone.speed;
    if (keys['ArrowRight'] || keys['d']) drone.vx = drone.speed;
    if (keys['ArrowUp'] || keys['w']) drone.vy = -drone.speed;
    if (keys['ArrowDown'] || keys['s']) drone.vy = drone.speed;
    drone.x = Math.max(0, Math.min(width, drone.x + drone.vx));
    drone.y = Math.max(0, Math.min(height, drone.y + drone.vy));

    // Move debris
    debris.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > width) d.vx *= -1;
      if (d.y < 0 || d.y > height) d.vy *= -1;
    });

    // Collision detection (drone with debris)
    for (const d of debris) {
      const dx = d.x - drone.x;
      const dy = d.y - drone.y;
      if (dx * dx + dy * dy < (d.r + DRONE_SIZE) ** 2) {
        over = true;
        // Play collision sound (lower pitch)
        playBeep(150, 300);
        break;
      }
    }

    // Increase pressure for each leaking module
    const leakingCount = modules.filter(m => m.leaking).length;
    pressure += leakingCount * PRESSURE_INCREASE;
    if (pressure >= PRESSURE_MAX) over = true;
  }

  function drawStation() {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(performance.now() / 5000); // slow rotation
    // Station outline with gradient
    const grad = ctx.createRadialGradient(0, 0, STATION_RADIUS * 0.7, 0, 0, STATION_RADIUS);
    grad.addColorStop(0, '#555');
    grad.addColorStop(1, '#111');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, STATION_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    // Draw modules with radial gradients
    modules.forEach((m) => {
      const x = Math.cos(m.angle) * STATION_RADIUS;
      const y = Math.sin(m.angle) * STATION_RADIUS;
      const moduleGrad = ctx.createRadialGradient(x, y, 2, x, y, 8);
      if (m.leaking) {
        moduleGrad.addColorStop(0, '#ff6666');
        moduleGrad.addColorStop(1, '#800000');
      } else {
        moduleGrad.addColorStop(0, '#66ff66');
        moduleGrad.addColorStop(1, '#008000');
      }
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = moduleGrad;
      ctx.fill();
    });
    ctx.restore();
  }

  function drawDrone() {
    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.beginPath();
    ctx.moveTo(0, -DRONE_SIZE);
    ctx.lineTo(DRONE_SIZE / 2, DRONE_SIZE / 2);
    ctx.lineTo(-DRONE_SIZE / 2, DRONE_SIZE / 2);
    ctx.closePath();
    ctx.fillStyle = 'cyan';
    ctx.fill();
    ctx.restore();
  }

  function drawDebris() {
    debris.forEach((d) => {
      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw background stars with twinkling effect
  function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach((s) => {
      // Slight flicker by varying alpha
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  function drawHUD() {
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Pressure: ${pressure.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    ctx.clearRect(0, 0, width, height);
    drawStars();
    drawStation();
    drawDebris();
    drawDrone();
    drawHUD();
    if (!over) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
