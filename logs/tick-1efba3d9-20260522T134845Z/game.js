// Orbit Dodge game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Set canvas size to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // Recalculate centre and orbit radius
    centre = { x: canvas.width / 2, y: canvas.height / 2 };
    orbitRadius = Math.min(canvas.width, canvas.height) * 0.35;
  };
  window.addEventListener('resize', resize);
  resize();
  // generate starfield for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Game state
  let centre = { x: canvas.width / 2, y: canvas.height / 2 };
  let orbitRadius = Math.min(canvas.width, canvas.height) * 0.35;
  const satellite = {
    angle: 0, // radians
    angularSpeed: 0.0015, // rad per ms
    radius: 12,
    color: '#00ffcc',
  };
  const debris = [];
  const debrisConfig = {
    minSpeed: 0.05,
    maxSpeed: 0.25,
    radius: 8,
    spawnInterval: 800, // ms
    lastSpawn: 0,
  };
  let startTime = null;
  let score = 0;
  let running = true;

  // Input handling – arrow left/right change angle, up/down change speed
  const keys = {};
  window.addEventListener('keydown', (e) => {
    // resume audio context on user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  function spawnDebris(timestamp) {
    if (timestamp - debrisConfig.lastSpawn < debrisConfig.spawnInterval) return;
    debrisConfig.lastSpawn = timestamp;
    const angle = Math.random() * Math.PI * 2;
    const speed = debrisConfig.minSpeed + Math.random() * (debrisConfig.maxSpeed - debrisConfig.minSpeed);
    // start at edge of canvas along the angle direction
    const startDist = Math.max(canvas.width, canvas.height);
    debris.push({
      angle,
      distance: startDist,
      speed,
    });
    // sound for new debris
    playSound(300, 0.08);
  }

  function update(delta) {
    // satellite controls
    if (keys.ArrowLeft) satellite.angle -= satellite.angularSpeed * delta;
    if (keys.ArrowRight) satellite.angle += satellite.angularSpeed * delta;
    if (keys.ArrowUp) satellite.angularSpeed *= 1.02; // accelerate
    if (keys.ArrowDown) satellite.angularSpeed *= 0.98; // decelerate

    // update debris positions
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.distance -= d.speed * delta;
      if (d.distance < 0) {
        debris.splice(i, 1);
        continue;
      }
      // collision detection
      const satX = centre.x + Math.cos(satellite.angle) * orbitRadius;
      const satY = centre.y + Math.sin(satellite.angle) * orbitRadius;
      const debrisX = centre.x + Math.cos(d.angle) * d.distance;
      const debrisY = centre.y + Math.sin(d.angle) * d.distance;
      const dx = satX - debrisX;
      const dy = satY - debrisY;
      const distSq = dx * dx + dy * dy;
      const radSum = satellite.radius + debrisConfig.radius;
      if (distSq < radSum * radSum) {
        running = false;
        // collision sound
        playSound(100, 0.3);
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw starfield
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
    // planet centre
    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(
      centre.x,
      centre.y,
      orbitRadius * 0.05,
      centre.x,
      centre.y,
      orbitRadius * 0.2
    );
    planetGrad.addColorStop(0, '#555');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, orbitRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // orbit path
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    // satellite with glow
    const satX = centre.x + Math.cos(satellite.angle) * orbitRadius;
    const satY = centre.y + Math.sin(satellite.angle) * orbitRadius;
    // glow effect
    ctx.shadowColor = satellite.color;
    ctx.shadowBlur = 12;
    // radial gradient for satellite
    const satGrad = ctx.createRadialGradient(satX, satY, 0, satX, satY, satellite.radius);
    satGrad.addColorStop(0, satellite.color);
    satGrad.addColorStop(1, '#000');
    ctx.fillStyle = satGrad;
    ctx.beginPath();
    ctx.arc(satX, satY, satellite.radius, 0, Math.PI * 2);
    ctx.fill();
    // reset shadow
    ctx.shadowBlur = 0;

    // debris with gradient and slight glow
    for (const d of debris) {
      const x = centre.x + Math.cos(d.angle) * d.distance;
      const y = centre.y + Math.sin(d.angle) * d.distance;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, debrisConfig.radius);
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#ff5555');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff5555';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, debrisConfig.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // UI – score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastTimestamp || timestamp);
    lastTimestamp = timestamp;
    if (running) {
      score = (timestamp - startTime) / 1000; // seconds
      spawnDebris(timestamp);
      update(delta);
    }
    draw();
    if (running) requestAnimationFrame(loop);
  }
  let lastTimestamp = null;
  requestAnimationFrame(loop);
})();
