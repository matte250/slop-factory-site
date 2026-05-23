// Asteroid Dodge – minimal implementation
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, length) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + length);
  };
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  // generate background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 0.5 });
  }

  // Planet at centre with radial gradient
  const planet = { x: W / 2, y: H / 2, r: 20 };
  const planetGradient = ctx.createRadialGradient(planet.x, planet.y, planet.r / 4, planet.x, planet.y, planet.r);
  planetGradient.addColorStop(0, '#4e9a06');
  planetGradient.addColorStop(1, '#2c3e50');

  // Ship orbit parameters
  let shipRadius = 80;
  let shipAngle = 0;
  const shipSize = 10;

  // Controls
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid list
  const asteroids = [];
  const maxAsteroids = 30;

  // Utility
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Spawn an asteroid from a random edge heading toward centre
  const spawnAsteroid = () => {
    const edge = Math.floor(rand(0, 4)); // 0: top,1:right,2:bottom,3:left
    let x, y;
    if (edge === 0) { x = rand(0, W); y = -10; }
    else if (edge === 1) { x = W + 10; y = rand(0, H); }
    else if (edge === 2) { x = rand(0, W); y = H + 10; }
    else { x = -10; y = rand(0, H); }
    const angle = Math.atan2(planet.y - y, planet.x - x);
    // play spawn sound
    playTone(300, 0.05);
    const speed = rand(1, 2.5);
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 8 });
  };

  // Update ship based on input
  const updateShip = () => {
    if (keys.ArrowUp) { shipRadius = Math.max(30, shipRadius - 1); playTone(600,0.05); }
    if (keys.ArrowDown) shipRadius = Math.min(Math.min(W, H) / 2 - 20, shipRadius + 1);
    if (keys.ArrowLeft) { shipAngle -= 0.03; playTone(400,0.05); }
    if (keys.ArrowRight) { shipAngle += 0.03; playTone(500,0.05); }
  };

  const update = () => {
    updateShip();
    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
    // remove off‑screen (shouldn't happen often)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -20 || a.x > W + 20 || a.y < -20 || a.y > H + 20) asteroids.splice(i, 1);
    }
    // spawn new asteroids periodically
    if (asteroids.length < maxAsteroids && Math.random() < 0.02) spawnAsteroid();
    // collision detection
    const shipX = planet.x + Math.cos(shipAngle) * shipRadius;
    const shipY = planet.y + Math.sin(shipAngle) * shipRadius;
    for (const a of asteroids) {
      const dx = a.x - shipX;
      const dy = a.y - shipY;
      if (Math.hypot(dx, dy) < a.r + shipSize) {
        cancelAnimationFrame(animId);
        playTone(200,0.2);
        alert('Game Over');
        return;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    // stars background
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with gradient
    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // ship as triangle, with shadow
    const shipX = planet.x + Math.cos(shipAngle) * shipRadius;
    const shipY = planet.y + Math.sin(shipAngle) * shipRadius;
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(shipAngle + Math.PI / 2);
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, -shipSize);
    ctx.lineTo(shipSize / 2, shipSize / 2);
    ctx.lineTo(-shipSize / 2, shipSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with simple shading
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.fillStyle = '#95a5a6';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // reset shadow
    ctx.shadowBlur = 0;
  };

  let animId;
  const loop = () => {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  };
  loop();
})();
