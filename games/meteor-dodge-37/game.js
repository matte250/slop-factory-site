// Meteor Dodge game implementation targeting <canvas id="game"></canvas>
// Simple vanilla JS, no external dependencies.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context runs after user interaction
  window.addEventListener('click', () => audioCtx.resume(), { once: true });
  function playSound(freq, type = 'sine', dur = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship parameters
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Meteor parameters
  const meteors = [];
  const meteorRadius = 15;
  let meteorSpawnInterval = 1500; // ms
  let lastMeteorSpawn = 0;
  let meteorSpeed = 2;

  // Game state
  let startTime = null;
  let elapsed = 0;
  let score = 0;
  let gameOver = false;
  const maxDuration = 180000; // 3 minutes in ms

  // Input handling
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      ship.moveLeft = true;
      playSound(220, 'triangle', 0.05);
    }
    if (e.key === 'ArrowRight') {
      ship.moveRight = true;
      playSound(330, 'triangle', 0.05);
    }
  };
  const onKeyUp = (e) => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Touch support (simple left/right split screen)
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < width / 2) ship.moveLeft = true; else ship.moveRight = true;
  });
  canvas.addEventListener('touchend', () => {
    ship.moveLeft = false;
    ship.moveRight = false;
  });

  function spawnMeteor() {
    const x = Math.random() * (width - meteorRadius * 2) + meteorRadius;
    meteors.push({ x, y: -meteorRadius, radius: meteorRadius });
  }

  function update(delta) {
    // Move ship
    if (ship.moveLeft) ship.x -= ship.speed;
    if (ship.moveRight) ship.x += ship.speed;
    // Clamp ship within canvas
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // Move stars (slow vertical scroll for parallax)
    const starSpeed = 0.3; // pixels per frame
    for (const s of stars) {
      s.y += starSpeed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Spawn meteors
    if (Date.now() - lastMeteorSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastMeteorSpawn = Date.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += meteorSpeed;
      // Remove off-screen meteors
      if (m.y - m.radius > height) meteors.splice(i, 1);
    }

    // Increase difficulty over time
    meteorSpeed = 2 + elapsed / 30000; // speed up every 30s
    meteorSpawnInterval = Math.max(300, 1500 - elapsed / 100); // faster spawns

    // Collision detection
    for (const m of meteors) {
      const shipCenterX = ship.x + ship.width / 2;
      const shipTopY = ship.y;
      const dx = Math.abs(m.x - shipCenterX);
      const dy = Math.abs(m.y - shipTopY);
      // simple AABB-circle check
      if (dx < ship.width / 2 + m.radius && dy < ship.height / 2 + m.radius) {
        // Play explosion sound
        playSound(120, 'sawtooth', 0.3);
        gameOver = true;
        break;
      }
    }

    // Update score
    score = Math.floor(elapsed / 1000);

    // Check time limit
    if (elapsed >= maxDuration) gameOver = true;
  }

  function draw() {
    // Dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Twinkling stars (randomly vary radius)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      if (Math.random() < 0.05) s.radius = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with gradient shading
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.height);
    shipGrad.addColorStop(0, '#4da6ff');
    shipGrad.addColorStop(1, '#001a33');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Meteors with glowing radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
      grad.addColorStop(0, 'rgba(255,165,0,0.9)');
      grad.addColorStop(1, 'rgba(139,69,19,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score in bright yellow
    ctx.fillStyle = '#ff0';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    elapsed = timestamp - startTime;
    if (!gameOver) {
      update(elapsed);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Final draw with game over message
      draw();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Score: ${score}s`, width / 2, height / 2 + 30);
    }
  }

  requestAnimationFrame(loop);
})();
