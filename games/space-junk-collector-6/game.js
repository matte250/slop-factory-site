// Simple Space Junk Collector game
// Targets <canvas id="game"></canvas> in the surrounding HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone generator
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrustTime = 0;
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship state with thrust flag
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.05,
    radius: 10,
    hull: 3,
    fuel: 100,
    thrusting: false,
  };

  // Remove accidental duplicate ship definition

  // Debris array
  const maxStars = 80;
  const stars = [];
  for (let i = 0; i < maxStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Debris array
  const debris = [];
  const maxDebris = 30;

  // Input handling
  const keys = {};
  // Resume audio on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnDebris() {
    if (debris.length >= maxDebris) return;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    switch (side) {
      case 0: // top
        x = Math.random() * width; y = -10; vx = (Math.random() - 0.5) * speed; vy = speed; break;
      case 1: // bottom
        x = Math.random() * width; y = height + 10; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
      case 2: // left
        x = -10; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
      case 3: // right
        x = width + 10; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
    }
    debris.push({x, y, vx, vy, radius: 5 + Math.random() * 8});
  }

  function update() {
    // Controls
    if (keys['ArrowUp'] || keys['w']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel = Math.max(0, ship.fuel - 0.05);
      ship.thrusting = true;
      const now = performance.now();
      if (now - lastThrustTime > 100) { // play every 100ms
        playTone(200, 0.08);
        lastThrustTime = now;
      }
    } else {
      ship.thrusting = false;
    }
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight'] || keys['d']) ship.angle += ship.turnSpeed;

    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Move debris
    debris.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
    });
    // Remove off‑screen debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      if (d.x < -20 || d.x > width + 20 || d.y < -20 || d.y > height + 20) {
        debris.splice(i, 1);
      }
    }

    // Collision detection
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      const dx = d.x - ship.x;
      const dy = d.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < d.radius + ship.radius) {
        // collect small debris, hit large debris
        if (d.radius < 10) {
          // points could be added here
          debris.splice(i, 1);
        } else {
          // collision with large debris
          ship.hull--;
          playTone(100, 0.2);
          debris.splice(i, 1);
        }
      }
    }

    // Game over check
    if (ship.hull <= 0 || ship.fuel <= 0) {
      cancelAnimationFrame(frameId);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }

    spawnDebris();
    draw();
    frameId = requestAnimationFrame(update);
  }

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  // Background
  ctx.fillStyle = '#001020';
  ctx.fillRect(0, 0, width, height);
  // Stars
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  // Ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  // Thrust flame
  if (ship.thrusting) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
  }
  ctx.restore();

  // Debris with size‑based colour
  debris.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fillStyle = d.radius > 10 ? 'orange' : 'gray';
    ctx.fill();
  });

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Hull: ${ship.hull}  Fuel: ${Math.round(ship.fuel)}`, 10, 20);
}

  let frameId = requestAnimationFrame(update);
})();
