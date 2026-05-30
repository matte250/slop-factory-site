// Simple Meteor Dodge game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Ship configuration
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Meteor configuration
  const meteors = [];
  let meteorSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let difficultyTimer = 0;

  // Score
  let startTime = performance.now();
  let score = 0;

  // Input handling (keyboard)
  const keyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = true;
  };
  const keyUp = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = false;
  };
  window.addEventListener('keydown', keyDown);
  // Ensure audio context is resumed on first user interaction
  window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', keyUp);

  // Optional mouse movement
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    ship.x = Math.min(Math.max(mouseX - ship.width / 2, 0), width - ship.width);
  });

  function spawnMeteor() {
    // Play a short metallic tone when a meteor appears
    playTone(300, 0.08);
    const radius = 15 + Math.random() * 15;
    meteors.push({
      x: Math.random() * (width - radius * 2) + radius,
      y: -radius,
      radius,
      speedY: 2 + Math.random() * 3,
      speedX: (Math.random() - 0.5) * 1.5,
    });
  }

  function update(delta) {
    // Update ship
    if (ship.moveLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (ship.moveRight) ship.x = Math.min(width - ship.width, ship.x + ship.speed);

    // Spawn meteors based on interval
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Increase difficulty over time
    difficultyTimer += delta;
    if (difficultyTimer > 10000) { // every 10 seconds
      meteorSpawnInterval = Math.max(300, meteorSpawnInterval - 100);
      difficultyTimer = 0;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speedY;
      m.x += m.speedX;
      // Remove off-screen meteors
      if (m.y - m.radius > height) {
        meteors.splice(i, 1);
        continue;
      }
      // Collision with ship (rect-circle)
      const closestX = Math.max(ship.x, Math.min(m.x, ship.x + ship.width));
      const closestY = Math.max(ship.y, Math.min(m.y, ship.y + ship.height));
      const distX = m.x - closestX;
      const distY = m.y - closestY;
      if (distX * distX + distY * distY < m.radius * m.radius) {
        gameOver();
        return;
      }
    }

    // Update score based on survival time
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw ship as a triangle for a sleeker look
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw meteors with radial gradient for a glowing effect
    meteors.forEach((m) => {
      const gradient = ctx.createRadialGradient(m.x, m.y, m.radius * 0.2, m.x, m.y, m.radius);
      gradient.addColorStop(0, '#ffbbbb');
      gradient.addColorStop(1, '#992222');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOverFlag) requestAnimationFrame(loop);
  }

  let gameOverFlag = false;
  function gameOver() {
    // Play explosion sound on collision
    playTone(100, 0.3);
    gameOverFlag = true;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
