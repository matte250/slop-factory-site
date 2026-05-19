// Asteroid Dodge – minimal implementation
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = { x: width / 2, y: height - 50, w: 30, h: 30, speed: 4 };
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawnRate = 1000; // ms
  const asteroidSpeed = 2;

  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;

  // Starfield background
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    // add rotation properties
    const angle = 0;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // small spin
    asteroids.push({ x, y: -size, w: size, h: size, angle, rotSpeed });
    // sound cue for new asteroid
    beep(300, 0.08);
  }

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Asteroid movement and rotation
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += asteroidSpeed;
      a.angle += a.rotSpeed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Starfield movement (slow drift down)
    for (const s of stars) {
      s.y += 0.3; // subtle speed
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
  

    // Collision detection
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y < a.y + a.h &&
        ship.y + ship.h > a.y
      ) {
        gameOver = true;
        // crash sound
        beep(150, 0.3);
        break;
      }
    }

function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship – already drawn with gradient in update? Actually ship drawn here
    // Draw ship with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.7)';
    ctx.shadowBlur = 10;
    // ship drawing code (same as earlier gradient block)
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids – draw with radial gradient for glow and rotation
    for (const a of asteroids) {
      ctx.save();
      // Translate to asteroid center
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.angle);
      // Create gradient centered at origin
      const grad = ctx.createRadialGradient(
        0,
        0,
        a.w * 0.1,
        0,
        0,
        a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const score = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastSpawn || timestamp);
    if (!gameOver) {
      if (timestamp - lastSpawn > asteroidSpawnRate) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
