// Simple Meteor Dodge game with improved graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, duration = 0.05) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  function playShoot() {
    playTone(300);
  }

  function playExplosion() {
    // short noise burst
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.1);
  }

  function playHit() {
    playTone(100, 0.2);
  }

  // Game settings
  const shipWidth = 40;
  const shipHeight = 20;
  const shipSpeed = 5;
  const bulletSpeed = 7;
  const meteorSpeed = 2;
  const meteorRadius = 15;
  const spawnInterval = 1000; // ms
  const maxLives = 3;

  // Game state
  let shipX = width / 2 - shipWidth / 2;
  let shipY = height - shipHeight - 10;
  let bullets = [];
  let meteors = [];
  let lastSpawn = 0;
  let lives = maxLives;
  let score = 0;
  let leftPressed = false;
  let rightPressed = false;
  let spacePressed = false;

  // Input handling
  document.addEventListener('keydown', e => {
    // Ensure audio context is running on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowLeft') leftPressed = true;
    if (e.code === 'ArrowRight') rightPressed = true;
    if (e.code === 'Space') spacePressed = true;
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') leftPressed = false;
    if (e.code === 'ArrowRight') rightPressed = false;
    if (e.code === 'Space') spacePressed = false;
  });

  function spawnMeteor() {
    const x = Math.random() * (width - meteorRadius * 2) + meteorRadius;
    meteors.push({ x, y: -meteorRadius, radius: meteorRadius });
  }

  function update(dt) {
    // Move ship
    if (leftPressed) shipX = Math.max(0, shipX - shipSpeed);
    if (rightPressed) shipX = Math.min(width - shipWidth, shipX + shipSpeed);

    // Shoot
    if (spacePressed) {
      // Simple rate limit: one bullet per 200ms
if (!bullets.length || Date.now() - bullets[bullets.length - 1].ts > 200) {
          bullets.push({ x: shipX + shipWidth / 2, y: shipY, ts: Date.now() });
          playShoot();
        }
    }

    // Update bullets
    bullets.forEach(b => b.y -= bulletSpeed);
    bullets = bullets.filter(b => b.y > 0);

    // Update meteors
    meteors.forEach(m => m.y += meteorSpeed);
    meteors = meteors.filter(m => m.y - m.radius < height);

    // Collision: bullet vs meteor
    bullets = bullets.filter(b => {
      for (let i = 0; i < meteors.length; i++) {
        const m = meteors[i];
        const dx = b.x - m.x;
        const dy = b.y - m.y;
        if (Math.hypot(dx, dy) < m.radius) {
          // hit
          meteors.splice(i, 1);
          score += 10;
          playExplosion();
          return false; // remove bullet
        }
      }
      return true;
    });

    // Collision: meteor vs ship
    meteors = meteors.filter(m => {
      const shipRect = { x: shipX, y: shipY, w: shipWidth, h: shipHeight };
      const closestX = Math.max(shipRect.x, Math.min(m.x, shipRect.x + shipRect.w));
      const closestY = Math.max(shipRect.y, Math.min(m.y, shipRect.y + shipRect.h));
      const dx = m.x - closestX;
      const dy = m.y - closestY;
if (dx * dx + dy * dy < m.radius * m.radius) {
          playHit();
          lives--;
          return false; // remove meteor
        }
      // Meteor reaches bottom
if (m.y - m.radius > height) {
          playHit();
          lives--;
          return false;
        }
      return true;
    });

    // Spawn meteors over time
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = Date.now();
    }
  }

  // Pre-generated star field for background
const stars = Array.from({length: 100}, () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 1.5 + 0.5,
}));

function drawBackground() {
  // dark space background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0, 0, width, height);
  // stars
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
    // Clear and draw background
    drawBackground();

    // Ship with gradient and flame when moving
    const shipGrad = ctx.createLinearGradient(0, shipY, 0, shipY + shipHeight);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(shipX, shipY + shipHeight);
    ctx.lineTo(shipX + shipWidth / 2, shipY);
    ctx.lineTo(shipX + shipWidth, shipY + shipHeight);
    ctx.closePath();
    ctx.fill();
    // simple flame when moving or shooting
    if (leftPressed || rightPressed || spacePressed) {
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(shipX + shipWidth / 2 - 5, shipY + shipHeight);
      ctx.lineTo(shipX + shipWidth / 2, shipY + shipHeight + 12);
      ctx.lineTo(shipX + shipWidth / 2 + 5, shipY + shipHeight);
      ctx.closePath();
      ctx.fill();
    }

    // Bullets with glow
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset

    // Meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.radius * 0.2, m.x, m.y, m.radius);
      grad.addColorStop(0, '#ff6600');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'transparent';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
  }

  function loop(timestamp) {
    if (lives <= 0) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2 - 80, height / 2 + 40);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
