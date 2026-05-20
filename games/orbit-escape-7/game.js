// Minimalist Orbit Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  let audioCtx;
  const playTone = (freq, duration) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(300, 0.08);
  const playExplosion = () => playTone(100, 0.4);
  let lastThrustTime = 0;

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 0, // angle in radians
    vx: 0,
    vy: 0,
    size: 8,
  };

  // Debris pool
  const debris = [];
  const maxDebris = 30;
  const spawnInterval = 800; // ms

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnDebris() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 1.5;
    const radius = 4 + Math.random() * 6;
    // Spawn just outside a random side
    let x, y, vx, vy;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: // left
        x = -radius; y = Math.random() * height; vx = speed; vy = 0; break;
      case 1: // top
        x = Math.random() * width; y = -radius; vx = 0; vy = speed; break;
      case 2: // right
        x = width + radius; y = Math.random() * height; vx = -speed; vy = 0; break;
      case 3: // bottom
        x = Math.random() * width; y = height + radius; vx = 0; vy = -speed; break;
    }
    debris.push({x, y, vx, vy, radius});
  }

  function update(dt) {
    // Controls
    if (keys.ArrowLeft) ship.r -= 0.07;
    if (keys.ArrowRight) ship.r += 0.07;
    if (keys.ArrowUp) {
      const thrust = 0.08;
      ship.vx += Math.cos(ship.r) * thrust;
      ship.vy += Math.sin(ship.r) * thrust;
      // play thrust sound, limit rate
      const now = performance.now();
      if (now - lastThrustTime > 80) {
        playThrust();
        lastThrustTime = now;
      }
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Update debris
    debris.forEach(d => {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    });
    // Remove off‑screen debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      if (d.x < -d.radius || d.x > width + d.radius || d.y < -d.radius || d.y > height + d.radius) {
        debris.splice(i, 1);
      }
    }
    // Collision detection
    for (const d of debris) {
      const dx = ship.x - d.x;
      const dy = ship.y - d.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size + d.radius) return gameOver();
    }
    // Bounds check – leave canvas = loss
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) return gameOver();
  }

  let startTime = performance.now();
  let last = startTime;
  let running = true;
  function loop(now) {
    const dt = (now - last) / 16; // normalized to ~60fps step
    last = now;
if (running) {
      update(dt);
      draw(now);
      requestAnimationFrame(loop);
    }
  }

  function draw(now) {
    // Background – dark gradient with subtle stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // tiny star field
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Ship – glowing triangle
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.r);
    // glow effect
    ctx.shadowColor = 'rgba(0,255,0,0.7)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size, ship.size / 2);
    ctx.lineTo(-ship.size, -ship.size / 2);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Debris – semi‑transparent, varied colors
    for (const d of debris) {
      const hue = Math.floor(200 + Math.random() * 40);
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.85)`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score (time survived) – crisp white with shadow
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.font = '14px monospace';
    const elapsed = ((now - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 24);
    ctx.shadowBlur = 0;
  }

  function gameOver() {
    running = false;
    // explosion sound
    playExplosion();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width/2, height/2);
  }

  // Start spawning debris
  setInterval(() => {
    if (debris.length < maxDebris) spawnDebris();
  }, spawnInterval);

  requestAnimationFrame(loop);
})();
