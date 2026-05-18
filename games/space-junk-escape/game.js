// Simple Space Junk Escape game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const w = (canvas.width = canvas.width || 800);
  const h = (canvas.height = canvas.height || 600);

  // Ship
  const ship = {
    x: w / 2,
    y: h - 60,
    w: 30,
    h: 30,
    speed: 4,
    fuel: 100,
    alive: true,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Resume AudioContext on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Game objects
  const junk = [];
  const fuel = [];
  let score = 0;
  let frame = 0;

  function spawnJunk() {
    const size = Math.random() * 20 + 10;
    junk.push({
      x: Math.random() * (w - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
    });
  }

  function spawnFuel() {
    const r = 8;
    fuel.push({ x: Math.random() * (w - r * 2) + r, y: -r, r, speed: 1.5 });
  }

  function rectCollide(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function circleRectCollide(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update() {
    if (!ship.alive) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(h - ship.h, ship.y));

    // Fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) ship.alive = false;

    // Spawn junk/fuel periodically
    if (frame % 60 === 0) spawnJunk(); // roughly every second
    if (frame % 180 === 0) spawnFuel(); // every 3 seconds

    // Update junk
    junk.forEach((j) => (j.y += j.speed));
    // Update fuel cells
    fuel.forEach((f) => (f.y += f.speed));

    // Collision detection
    for (let i = junk.length - 1; i >= 0; i--) {
      const j = junk[i];
      if (rectCollide(ship, j)) {
        playTone(200, 0.2);
        ship.alive = false;
      }
      if (j.y > h) junk.splice(i, 1);
    }
    for (let i = fuel.length - 1; i >= 0; i--) {
      const f = fuel[i];
if (circleRectCollide(f, ship)) {
          playTone(600, 0.1);
          ship.fuel = Math.min(100, ship.fuel + 30);
          score += 10;
          fuel.splice(i, 1);
        } else if (f.y > h) {
        fuel.splice(i, 1);
      }
    }
    frame++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000011');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Starfield (simple twinkling stars)
    if (!window.__stars) {
      window.__stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      }));
    }
    ctx.fillStyle = 'white';
    window.__stars.forEach((s) => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.y += s.speed;
      if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
    });

    // Ship (gradient triangle with rotation based on horizontal input)
    const shipAngle = (keys.ArrowRight ? 0.1 : keys.ArrowLeft ? -0.1 : 0);
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.rotate(shipAngle);
    const shipGrad = ctx.createLinearGradient(0, -ship.h / 2, 0, ship.h / 2);
    shipGrad.addColorStop(0, ship.alive ? '#00ffff' : '#777777');
    shipGrad.addColorStop(1, ship.alive ? '#0044ff' : '#333333');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Junk (red rotated squares with shadow)
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 4;
    junk.forEach((j) => {
      const angle = Math.random() * Math.PI * 2;
      ctx.save();
      ctx.translate(j.x + j.w / 2, j.y + j.h / 2);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(200,20,20,0.9)';
      ctx.fillRect(-j.w / 2, -j.h / 2, j.w, j.h);
      ctx.restore();
    });
    ctx.shadowColor = 'transparent';

    // Fuel cells (glowing green circles)
    fuel.forEach((f) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,255,0,0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00ff44';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // HUD (semi‑transparent overlay)
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 100, 20);
    if (!ship.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
