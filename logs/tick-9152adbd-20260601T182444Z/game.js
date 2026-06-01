// Minimal Meteor Dash game targeting canvas with id="game"
// Ship moves horizontally at bottom, meteors fall from top.
// Collision ends the game.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  // Set canvas size (you may adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  function playTone(freq, type = 'sine', duration = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Generate background stars once
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
  };

  const meteors = [];
  const meteorSize = 30;
  const meteorSpeed = 2;
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;
  let gameOver = false;

  const keys = { ArrowLeft: false, ArrowRight: false };

  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // Spawn meteors
    if (performance.now() - lastSpawn > spawnInterval) {
      meteors.push({
        x: Math.random() * (canvas.width - meteorSize),
        y: -meteorSize,
        size: meteorSize,
      });
      playTone(500, 'square', 0.1); // meteor spawn sound
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += meteorSpeed;
      // Remove off‑screen meteors
      if (m.y > canvas.height) meteors.splice(i, 1);
      // Collision detection (AABB)
      if (
        ship.x < m.x + m.size &&
        ship.x + ship.width > m.x &&
        ship.y < m.y + m.size &&
        ship.y + ship.height > m.y
      ) {
          gameOver = true;
          playTone(200, 'sawtooth', 0.5); // collision sound
        }
    }
  }

function draw() {
    // Slight motion blur background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw star field
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship as gradient triangle
    const shipGradient = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.height);
    shipGradient.addColorStop(0, '#0f0');
    shipGradient.addColorStop(1, '#050');
    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Draw meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.1,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, '#ff4444');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }


  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handlers
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key] = true;
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key] = false;
    }
  });

  requestAnimationFrame(loop);
})();
