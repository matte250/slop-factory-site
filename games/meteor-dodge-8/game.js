// Simple Meteor Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship settings
  const ship = { w: 50, h: 20, x: width / 2 - 25, y: height - 30, speed: 5 };
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') {
      keys.left = true;
      playSound(400, 0.05);
    }
    if (e.key === 'ArrowRight') {
      keys.right = true;
      playSound(500, 0.05);
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Meteor settings
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Score
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnMeteor() {
    const size = Math.random() * 30 + 10;
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
    });
    // Play meteor spawn sound
    playSound(150, 0.07);
  }

  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys.left) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.right) ship.x = Math.min(width - ship.w, ship.x + ship.speed);
    // Spawn meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }
    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off-screen
      if (m.y > height) meteors.splice(i, 1);
    }
    // Collision detection
    for (const m of meteors) {
      if (
        m.x < ship.x + ship.w &&
        m.x + m.w > ship.x &&
        m.y < ship.y + ship.h &&
        m.y + m.h > ship.y
      ) {
        gameOver = true;
        // Play collision sound
        playSound(80, 0.4);
        break;
      }
    }
    // Update score
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Ship as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score with shadow
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'black';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.shadowColor = 'transparent';
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff6';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
