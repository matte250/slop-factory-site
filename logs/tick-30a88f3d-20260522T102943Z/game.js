// game.js – Meteor Dodge
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // Full‑screen canvas with starfield background
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Starfield background
  const stars = [];
  const STAR_COUNT = 200;
  const initStars = () => {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        size: rand(0.5, 2),
        speed: rand(0.2, 0.6)
      });
    }
  };
  initStars();

  // Game state
  const state = {
    ship: { x: canvas.width / 2, y: canvas.height - 60, size: 20, speed: 5 },
    keys: {},
    meteors: [],
    orbs: [],
    score: 0,
    over: false,
    lastMeteor: 0,
    lastOrb: 0,
  };

  // Input handling (arrow keys & WASD)
  const keyMap = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down'
  };
  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const dir = keyMap[e.key];
    if (dir) state.keys[dir] = true;
  });
  window.addEventListener('keyup', e => {
    const dir = keyMap[e.key];
    if (dir) state.keys[dir] = false;
  });

  // Utility
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // Game objects
  const spawnMeteor = () => {
    const radius = rand(15, 30);
    state.meteors.push({
      x: rand(radius, canvas.width - radius),
      y: -radius,
      r: radius,
      speed: rand(2, 5)
    });
  };

  const spawnOrb = () => {
    const radius = 8;
    state.orbs.push({
      x: rand(radius, canvas.width - radius),
      y: -radius,
      r: radius,
      speed: rand(1, 3)
    });
  };

  // Main loop
  const update = (now) => {
    if (state.over) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 40);
      return;
    }

    // Move ship
    const { ship, keys } = state;
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    if (keys.up) ship.y -= ship.speed;
    if (keys.down) ship.y += ship.speed;
    // Keep inside bounds
    ship.x = Math.max(ship.size, Math.min(canvas.width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(canvas.height - ship.size, ship.y));

    // Spawn meteors/orbs over time
    if (now - state.lastMeteor > 800) { spawnMeteor(); state.lastMeteor = now; }
    if (now - state.lastOrb > 1500) { spawnOrb(); state.lastOrb = now; }

    // Update meteors
    state.meteors.forEach(m => m.y += m.speed);
    // Remove off‑screen meteors
    state.meteors = state.meteors.filter(m => m.y - m.r < canvas.height);

    // Update and collect orbs
    state.orbs.forEach(o => o.y += o.speed);
    state.orbs = state.orbs.filter(o => {
      if (o.y - o.r > canvas.height) return false;
      // collision with ship
if (distance(o.x, o.y, ship.x, ship.y) < o.r + ship.size) {
          state.score++;
          // Play a pleasant tone for collecting an orb
          playTone(600, 0.1);
          return false; // collected
        }
      return true;
    });

    // Collision detection (ship vs meteors)
    for (const m of state.meteors) {
if (distance(m.x, m.y, ship.x, ship.y) < m.r + ship.size) {
          // Play a crash tone
          playTone(200, 0.4);
          state.over = true;
          break;
        }
    }

    // Render
    // Dark space background with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000060');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Update and draw stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = rand(0, canvas.width);
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship – simple triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x - ship.size, ship.y - ship.size, ship.x + ship.size, ship.y + ship.size);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // Meteors with radial gradient
    for (const m of state.meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
      grad.addColorStop(0, '#ff9966');
      grad.addColorStop(1, '#331100');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orbs
    ctx.fillStyle = 'gold';
    for (const o of state.orbs) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score display
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 30);

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
})();
