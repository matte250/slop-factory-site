// Simple Meteor Dodge game with sound effects
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Helper sounds
  function playCollision() { playBeep(100, 0.3); }
  function playScore() { playBeep(400, 0.05); }


  // Player spaceship
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#00ff00',
  };

  // Meteor array
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let speedFactor = 1; // accelerates over time

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  let score = 0;
  let gameOver = false;
  let startTime = null;

  function spawnMeteor() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const y = -radius;
    const speedY = (Math.random() * 1 + 1) * speedFactor;
    meteors.push({ x, y, radius, speedY, color: '#ff4444' });
    // Play a short beep when a meteor appears
    playBeep(200, 0.08);
  }

  function update(delta) {
    if (gameOver) return;

    // Move player
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // Spawn meteors over time
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speedY;
      // Remove off-screen
      if (m.y - m.radius > height) {
        meteors.splice(i, 1);
        score++;
        // increase difficulty gradually
        speedFactor += 0.01;
        // play score sound
        playScore();
      } else if (checkCollision(m)) {
        gameOver = true;
        // play collision sound
        playCollision();
      }
    }
  }

  function checkCollision(meteor) {
    // Simple AABB vs circle collision
    const cx = meteor.x;
    const cy = meteor.y;
    const r = meteor.radius;
    const rx = ship.x;
    const ry = ship.y;
    const rw = ship.width;
    const rh = ship.height;

    // Find closest point on the rectangle to the circle center
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
  }

  function draw() {
    // Clear with background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#003566');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw meteors with radial gradient
    meteors.forEach(m => {
      const radGrad = ctx.createRadialGradient(m.x, m.y, m.radius * 0.2, m.x, m.y, m.radius);
      radGrad.addColorStop(0, '#ff8888');
      radGrad.addColorStop(1, '#ff4444');
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = radGrad;
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Press R to Restart', width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (startTime || timestamp);
    update(delta);
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    }
  }

  // Restart handler
  window.addEventListener('keydown', (e) => {
    if (gameOver && (e.key === 'r' || e.key === 'R')) {
      // reset state
      meteors.length = 0;
      ship.x = width / 2 - ship.width / 2;
      score = 0;
      speedFactor = 1;
      gameOver = false;
      lastSpawn = 0;
      startTime = null;
      requestAnimationFrame(loop);
    }
  });

  // Start game loop
  requestAnimationFrame(loop);
})();
