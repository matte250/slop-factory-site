// Meteor Dodge Game
// Canvas element with id "game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
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
  // Set canvas size (you may adjust based on CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = {
    width: 50,
    height: 20,
    x: canvas.width / 2 - 25,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    color: '#00f',
  };

  // Meteor properties
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  const meteorMinSpeed = 2;
  const meteorMaxSpeed = 5;
  const meteorSizeRange = [20, 50];

  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    const size = Math.random() * (meteorSizeRange[1] - meteorSizeRange[0]) + meteorSizeRange[0];
    const x = Math.random() * (canvas.width - size);
    const speed = Math.random() * (meteorMaxSpeed - meteorMinSpeed) + meteorMinSpeed;
    meteors.push({ x, y: -size, size, speed, color: '#a33' });
    playBeep(200, 0.1); // spawn sound
  }

  function update(delta) {
    // Player movement
    if (ship.moveLeft) ship.x -= ship.speed;
    if (ship.moveRight) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // Meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Check collision with ship
      if (
        m.x < ship.x + ship.width &&
        m.x + m.size > ship.x &&
        m.y < ship.y + ship.height &&
        m.y + m.size > ship.y
      ) {
        gameOver = true;
        playBeep(100, 0.5); // crash sound
      }
      // Remove passed meteors and increase score
      if (m.y > canvas.height) {
        meteors.splice(i, 1);
        score++;
      }
    }

    // Spawn new meteors
    if (!gameOver && performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#001');
    bgGradient.addColorStop(1, '#003');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ship as a sleek triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.2,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, '#faa');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score with shadow effect
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.shadowColor = 'transparent'; // reset shadow

    // Game over overlay with reddish tint
    if (gameOver) {
      ctx.fillStyle = 'rgba(150, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  requestAnimationFrame(loop);
})();
