// Simple Meteor Dodge game
// Targets <canvas id="game"></canvas> present in the HTML.
// Controls: ArrowLeft / ArrowRight (or A/D) to move the spaceship.
// Avoid falling meteors; survive as long as possible.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Set canvas size to its displayed size if not set via attributes
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Game settings
  const ship = {
    width: 50,
    height: 20,
    x: canvas.width / 2 - 25,
    y: canvas.height - 30,
    speed: 5,
  };

  const meteors = [];
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const meteorSpawnInterval = 1000; // ms
  const lastSpawn = { time: 0 };
  let left = false,
    right = false;
  let score = 0;
  let gameOver = false;
  let lastTimestamp = 0;

  // Input handling
  let audioStarted = false;
  const keyDown = (e) => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') right = true;
  };
  const keyUp = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') right = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  function spawnMeteor() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = Math.random() * 2 + 1; // fall speed
    meteors.push({ x, y: -radius, radius, speed });
    // Play a short whoosh for meteor spawn
    playTone(300, 0.04);
  }

  function update(dt) {
    // Move ship
    if (left) ship.x = Math.max(0, ship.x - ship.speed);
    if (right) ship.x = Math.min(canvas.width - ship.width, ship.x + ship.speed);

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * dt * 0.06; // scale speed
      // Remove off‑screen meteors
      if (m.y - m.radius > canvas.height) meteors.splice(i, 1);
    }

    // Collision detection (simple AABB vs circle)
    for (const m of meteors) {
      const closestX = Math.max(ship.x, Math.min(m.x, ship.x + ship.width));
      const closestY = Math.max(ship.y, Math.min(m.y, ship.y + ship.height));
      const dx = m.x - closestX;
      const dy = m.y - closestY;
if (dx * dx + dy * dy < m.radius * m.radius) {
          gameOver = true;
          // Play crash sound on collision
          playTone(150, 0.3);
          break;
        }
    }
  }

  function draw() {
    // Fill background (space)
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw star field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.height);
    shipGrad.addColorStop(0, '#4ab');
    shipGrad.addColorStop(1, '#003');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, m.radius * 0.2, m.x, m.y, m.radius);
      grad.addColorStop(0, '#ffb84d');
      grad.addColorStop(1, '#b22222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Final Score: ' + Math.floor(score), canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp; // ms
    lastTimestamp = timestamp;

    if (!gameOver) {
      // Spawn meteors at interval
      if (timestamp - lastSpawn.time > meteorSpawnInterval) {
        spawnMeteor();
        lastSpawn.time = timestamp;
      }
      update(dt);
      score += dt * 0.01; // score based on survival time
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
