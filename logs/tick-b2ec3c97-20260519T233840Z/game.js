// Minimal implementation of "Cosmic Cleaner" game
// Canvas id: "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur / 1000);
  }

  // Ship configuration
  const ship = { x: W / 2, y: H - 60, w: 30, h: 40, speed: 4, cargo: 0, alive: true };
  let vacuumOn = false;
  const keys = {};

  // Simple asteroid/debris generator
  const objects = [];
  function spawn() {
    const size = Math.random() * 20 + 10;
    const isDebris = Math.random() < 0.4; // 40% are collectable debris
    objects.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 1 + Math.random() * 2,
      debris: isDebris,
    });
  }
  setInterval(spawn, 800);

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') {
      vacuumOn = true;
      playTone(800, 100); // vacuum activation sound
    }
    if (e.key === 'd') {
      ship.cargo = 0; // cargo‑dump mini‑game shortcut
      playTone(300, 150);
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === ' ') vacuumOn = false;
  });

  // Collision helpers
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Main loop
  function update() {
    if (!ship.alive) return; // stop updating after death
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // Update objects
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      o.y += o.speed;
      // Collision with ship
      if (rectIntersect(ship, o)) {
      if (o.debris && vacuumOn) {
        ship.cargo++;
        objects.splice(i, 1);
        playTone(1000, 100); // collect debris sound
        continue;
      } else if (!o.debris) {
        // asteroid hit – ship destroyed
        ship.alive = false;
        playTone(200, 200); // collision sound
        break;
      }
      }
      // Remove off‑screen objects
      if (o.y > H) objects.splice(i, 1);
    }
    // Overload check
    if (ship.cargo > 10) ship.alive = false;
  }

function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw ship – triangle
    ctx.fillStyle = ship.alive ? '#0ff' : '#f00';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Vacuum beam visual – glowing gradient
    if (vacuumOn) {
      const beamGrad = ctx.createLinearGradient(0, ship.y, 0, 0);
      beamGrad.addColorStop(0, 'rgba(0,255,255,0)');
      beamGrad.addColorStop(1, 'rgba(0,255,255,0.4)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(ship.x + ship.w / 2 - 2, 0, 4, ship.y);
    }

    // Helper to draw a star for debris
    function drawStar(cx, cy, spikes, outerR, innerR, color) {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerR;
        y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw objects with better visuals
    objects.forEach(o => {
      if (o.debris) {
        drawStar(o.x + o.w / 2, o.y + o.h / 2, 5, o.w / 2, o.w / 4, '#ff0');
      } else {
        // asteroid as gray circle with slight radial gradient
        const grad = ctx.createRadialGradient(
          o.x + o.w / 2,
          o.y + o.h / 2,
          o.w * 0.1,
          o.x + o.w / 2,
          o.y + o.h / 2,
          o.w / 2
        );
        grad.addColorStop(0, '#555');
        grad.addColorStop(1, '#222');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + ship.cargo, 10, 20);
    if (!ship.alive) ctx.fillText('GAME OVER', W / 2 - 50, H / 2);
  }
    // Draw objects
    objects.forEach(o => {
      ctx.fillStyle = o.debris ? '#ff0' : '#888';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + ship.cargo, 10, 20);
    if (!ship.alive) ctx.fillText('GAME OVER', W / 2 - 50, H / 2);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
