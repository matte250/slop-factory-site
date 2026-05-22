// Minimal Meteor Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Generate static stars for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }

  // Ship configuration
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
  };

  // Meteor configuration
  const meteors = [];
  let meteorSpawnInterval = 800; // ms
  let lastSpawn = 0;
  let baseSpeed = 2; // initial fall speed

  let score = 0;
  let gameOver = false;

  // Input handling and audio unlock
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const unlockAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', e => { keys[e.code] = true; unlockAudio(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Simple beep sound generator
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  function updateShip() {
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    else if (keys.ArrowRight) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));
  }

  function spawnMeteor(time) {
    if (time - lastSpawn < meteorSpawnInterval) return;
    lastSpawn = time;
    const radius = 15 + Math.random() * 10;
    meteors.push({
      x: Math.random() * (width - radius * 2) + radius,
      y: -radius,
      r: radius,
      speed: baseSpeed + Math.random() * 1.5,
    });
    // Play spawn sound
    playBeep(300, 100);
    // Gradually increase difficulty
    if (meteorSpawnInterval > 300) meteorSpawnInterval -= 5;
    baseSpeed += 0.01;
  }

  function updateMeteors(delta) {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * delta * 0.06; // speed factor
      // Remove off‑screen meteors and increment score
        if (m.y - m.r > height) {
          meteors.splice(i, 1);
          score++;
          // Play score increment beep
          playBeep(800, 50);
        } else if (checkCollision(m)) {
          // Play collision beep
          playBeep(100, 200);
          gameOver = true;
        }
    }
  }

  function checkCollision(m) {
    // Simple AABB vs circle collision
    const closestX = Math.max(ship.x, Math.min(m.x, ship.x + ship.w));
    const closestY = Math.max(ship.y, Math.min(m.y, ship.y + ship.h));
    const dx = m.x - closestX;
    const dy = m.y - closestY;
    return dx * dx + dy * dy < m.r * m.r;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // Ship as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#f44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      updateShip();
      spawnMeteor(timestamp);
      updateMeteors(delta);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
