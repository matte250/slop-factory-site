// Simple Space Runner game based on IDEA.md
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');

  // Set canvas size to fill window (you can adjust later)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Ship definition
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 20,
    speed: 5,
    color: '#0ff',
  };

  // Input handling and audio init
  const keys = { left: false, right: false };
  let audioCtx = null;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // background drone
      setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 150;
        gain.gain.value = 0.02;
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }, 2000);
    }
  };
  const playTone = (freq, duration) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  window.addEventListener('keydown', e => {
    initAudio();
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });

  // Game objects
  const stars = [];
  const asteroids = [];
  let vortex = null; // optional gravity vortex
  let score = 0;
  let gameOver = false;

  // Utility functions
  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnStar = () => {
    stars.push({
      x: rand(0, canvas.width),
      y: -10,
      radius: rand(2, 4),
      speed: rand(1, 3),
    });
  };

  const spawnAsteroid = () => {
    const size = rand(20, 40);
    asteroids.push({
      x: rand(0, canvas.width - size),
      y: -size,
      size,
      speed: rand(2, 4),
    });
  };

  const spawnVortex = () => {
    vortex = {
      x: rand(100, canvas.width - 100),
      y: rand(100, canvas.height - 200),
      radius: 60,
      strength: 0.5,
    };
    // Vortex disappears after some time
    setTimeout(() => { vortex = null; }, 8000);
  };

  // Collision helpers
  const rectCircleCollide = (rx, ry, rw, rh, cx, cy, cr) => {
    const distX = Math.abs(cx - rx - rw / 2);
    const distY = Math.abs(cy - ry - rh / 2);
    if (distX > rw / 2 + cr) return false;
    if (distY > rh / 2 + cr) return false;
    if (distX <= rw / 2) return true;
    if (distY <= rh / 2) return true;
    const dx = distX - rw / 2;
    const dy = distY - rh / 2;
    return dx * dx + dy * dy <= cr * cr;
  };

  const rectRectCollide = (a, b) => {
    return a.x < b.x + b.size && a.x + a.width > b.x && a.y < b.y + b.size && a.y + a.height > b.y;
  };

  // Main loop
  let frame = 0;
  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${score}` , canvas.width / 2, canvas.height / 2 + 40);
      return;
    }

    // Update ship position
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // Apply vortex pull if present
    if (vortex) {
      const dx = vortex.x - (ship.x + ship.width / 2);
      const dy = vortex.y - (ship.y + ship.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < vortex.radius) {
        const pull = vortex.strength * (1 - dist / vortex.radius);
        ship.x += dx / dist * pull;
        ship.y += dy / dist * pull;
        // keep within bounds vertically
        ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));
      }
    }

    // Spawn objects over time
    if (frame % 30 === 0) spawnStar(); // about 2 per second
    if (frame % 90 === 0) spawnAsteroid(); // about 0.7 per second
    if (frame % 1800 === 0) spawnVortex(); // occasional vortex

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      // Check collection
      if (rectCircleCollide(ship.x, ship.y, ship.width, ship.height, s.x, s.y, s.radius)) {
        score += 10;
        // play collection sound
        playTone(800, 0.1);
        stars.splice(i, 1);
        continue;
      }
      // Remove off‑screen
      if (s.y - s.radius > canvas.height) stars.splice(i, 1);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship ends game
if (rectRectCollide(ship, a)) {
          // play crash sound
          playTone(200, 0.3);
          gameOver = true;
          break;
        }
      if (a.y - a.size > canvas.height) asteroids.splice(i, 1);
    }

    // Draw everything
    // Slight motion blur / trailing effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars with glow
    for (const s of stars) {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.size/2, a.y + a.size/2, a.size/4, a.x + a.size/2, a.y + a.size/2, a.size/2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vortex (if any) with glowing outline
    if (vortex) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(vortex.x, vortex.y, vortex.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // Ship drawn as a triangle with shading
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // optional ship outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);

    frame++;
    requestAnimationFrame(loop);
  };

  loop();
})();
