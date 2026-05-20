// Space Debris Dodge game
// Canvas with id="game" expected in the HTML.
// Simple implementation: a triangular ship controlled by arrow keys/WASD,
// random rectangular debris moving downwards, collision detection, and score.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.2;
  masterGain.connect(audioCtx.destination);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  function playThrust() {
    // short high‑pitched beep
    playTone(300, 0.05);
  }

  function playCrash() {
    // low buzz
    playTone(100, 0.4);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 60,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)) {
      // play thrust sound on movement key press
      playThrust();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Debris pool
  const debris = [];
// Star field
const stars = [];
const starCount = 100;
for (let i = 0; i < starCount; i++) {
  stars.push({ x: Math.random() * width, y: Math.random() * height, speed: Math.random() * 0.5 + 0.2 });
}
  const debrisSize = { min: 15, max: 40 };
  const debrisSpeed = { min: 2, max: 5 };

  let frame = 0;
  let score = 0;
  let running = true;

  function spawnDebris() {
    // Randomly spawn from top or sides as circles (asteroids) with rotation
    const side = Math.random() < 0.5 ? 'top' : (Math.random() < 0.5 ? 'left' : 'right');
    const radius = Math.random() * (debrisSize.max - debrisSize.min) + debrisSize.min;
    const speed = Math.random() * (debrisSpeed.max - debrisSpeed.min) + debrisSpeed.min;
    const angle = Math.random() * Math.PI * 2;
    const angularVel = (Math.random() - 0.5) * 0.02; // slow rotation
    if (side === 'top') {
      debris.push({
        x: Math.random() * (width - radius * 2),
        y: -radius * 2,
        r: radius,
        vx: 0,
        vy: speed,
        angle,
        angularVel,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`
      });
    } else if (side === 'left') {
      debris.push({
        x: -radius * 2,
        y: Math.random() * (height - radius * 2),
        r: radius,
        vx: speed,
        vy: 0,
        angle,
        angularVel,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`
      });
    } else { // right
      debris.push({
        x: width,
        y: Math.random() * (height - radius * 2),
        r: radius,
        vx: -speed,
        vy: 0,
        angle,
        angularVel,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`
      });
    }
  }
    // Randomly spawn from top or sides as circles (asteroids)
    const side = Math.random() < 0.5 ? 'top' : (Math.random() < 0.5 ? 'left' : 'right');
    const radius = Math.random() * (debrisSize.max - debrisSize.min) + debrisSize.min;
    const speed = Math.random() * (debrisSpeed.max - debrisSpeed.min) + debrisSpeed.min;
    if (side === 'top') {
      debris.push({
        x: Math.random() * (width - radius * 2),
        y: -radius * 2,
        r: radius,
        vx: 0,
        vy: speed,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`
      });
    } else if (side === 'left') {
      debris.push({
        x: -radius * 2,
        y: Math.random() * (height - radius * 2),
        r: radius,
        vx: speed,
        vy: 0,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`
      });
    } else { // right
      debris.push({
        x: width,
        y: Math.random() * (height - radius * 2),
        r: radius,
        vx: -speed,
        vy: 0,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`
      });
    }
  }
    // Randomly spawn from top or sides
    const side = Math.random() < 0.5 ? 'top' : (Math.random() < 0.5 ? 'left' : 'right');
    const size = Math.random() * (debrisSize.max - debrisSize.min) + debrisSize.min;
    if (side === 'top') {
      debris.push({
        x: Math.random() * (width - size),
        y: -size,
        w: size,
        h: size,
        vx: 0,
        vy: Math.random() * (debrisSpeed.max - debrisSpeed.min) + debrisSpeed.min,
      });
    } else if (side === 'left') {
      debris.push({
        x: -size,
        y: Math.random() * (height - size),
        w: size,
        h: size,
        vx: Math.random() * (debrisSpeed.max - debrisSpeed.min) + debrisSpeed.min,
        vy: 0,
      });
    } else { // right
      debris.push({
        x: width,
        y: Math.random() * (height - size),
        w: size,
        h: size,
        vx: -(Math.random() * (debrisSpeed.max - debrisSpeed.min) + debrisSpeed.min),
        vy: 0,
      });
    }
  }

  function updateShip() {
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));
  }

  function updateDebris() {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x += d.vx;
      d.y += d.vy;
      // rotate asteroid
      d.angle += d.angularVel;
      // Remove when off‑screen (consider radius)
      if (d.x > width || d.x + d.r * 2 < 0 || d.y > height || d.y + d.r * 2 < 0) {
        debris.splice(i, 1);
      }
    }
    // Spawn new debris every 30 frames
    if (frame % 30 === 0) spawnDebris();
  }

  function checkCollision() {
    // Approximate ship as circle with radius ship.size
    for (const d of debris) {
      const dx = ship.x - (d.x + d.r);
      const dy = ship.y - (d.y + d.r);
      const distance = Math.hypot(dx, dy);
      if (distance < ship.size + d.r) {
        running = false;
        playCrash();
        break;
      }
    }
  }

  // Draw background stars
    function drawStars() {
    // Gradient space background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  // stars
  ctx.fillStyle = '#555';
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    ctx.fillRect(s.x, s.y, 2, 2);
    s.y += s.speed;
    if (s.y > height) {
      s.y = 0;
      s.x = Math.random() * width;
    }
  }
}

function draw() {
    // Draw background with stars
    drawStars();
    // Ship (triangle)
    // Ship with subtle glow
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0f0';
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Debris (colored circles)
    for (const d of debris) {
      ctx.fillStyle = d.color || '#888';
      ctx.beginPath();
      ctx.arc(d.x + d.r, d.y + d.r, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!running) {
      draw();
      return; // stop animation
    }
    frame++;
    score += 0.016; // approximate seconds per frame at 60fps
    updateShip();
    updateDebris();
    checkCollision();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
