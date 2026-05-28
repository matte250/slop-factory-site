// Simple Meteor Dodge game with improved graphics
// Canvas with id="game" must exist in the HTML
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  let audioCtx = null;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  const playSound = (freq, duration) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  };
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship configuration
  // Ship gradient colors
  const shipGradientColors = ['#00ffff', '#0066ff'];
  const ship = {
    w: 30,
    h: 20,
    x: width / 2 - 15,
    y: height - 30,
    speed: 4,
    lives: 3,
    dx: 0,
    dy: 0,
  };

  // Meteor configuration
  const meteors = [];
  const stars = [];
  const starCount = 100;
  // Initialize stars with random positions
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  const meteorSpawnInterval = 1000; // ms
  const meteorSpeed = 2;
  const meteorRadius = 15;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; initAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updateShip() {
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
  }

  function spawnMeteor() {
    const x = Math.random() * (width - meteorRadius * 2) + meteorRadius;
    meteors.push({ x, y: -meteorRadius, r: meteorRadius });
    // play spawn sound
    playSound(300, 0.07);
  }

  function updateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += meteorSpeed;
      // remove if off screen
      if (m.y - m.r > height) meteors.splice(i, 1);
    }
  }

  function checkCollision() {
    for (const m of meteors) {
      const cx = m.x;
      const cy = m.y;
      const rectX = ship.x;
      const rectY = ship.y;
      const rectW = ship.w;
      const rectH = ship.h;
      // simple circle-rect collision
      const nearestX = Math.max(rectX, Math.min(cx, rectX + rectW));
      const nearestY = Math.max(rectY, Math.min(cy, rectY + rectH));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
      if (dx * dx + dy * dy < m.r * m.r) {
        // play hit sound
        playSound(120, 0.2);

        ship.lives -= 1;
        // remove this meteor
        const idx = meteors.indexOf(m);
        if (idx > -1) meteors.splice(idx, 1);
        if (ship.lives <= 0) gameOver();
        break;
      }
    }
  }

  let lastSpawn = 0;
  let animationId;
  let startTime = Date.now();
function gameOver() {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  function drawBackground() {
    // draw starry background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
  }

  function draw() {
    // draw background with stars
    drawBackground();
    // update stars for simple scrolling effect
    for (const s of stars) {
      s.y += 0.5;
      if (s.y > height) s.y = 0;
    }
    // draw ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, shipGradientColors[0]);
    shipGrad.addColorStop(1, shipGradientColors[1]);
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // draw meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(200,200,200,0.9)');
      grad.addColorStop(1, 'rgba(80,80,80,0.5)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw lives
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Lives: ' + ship.lives, 10, 20);
  }


  function loop(timestamp) {
    if (!lastSpawn) lastSpawn = timestamp;
    const delta = timestamp - lastSpawn;
    if (delta > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = timestamp;
    }
    updateShip();
    updateMeteors();
    checkCollision();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
