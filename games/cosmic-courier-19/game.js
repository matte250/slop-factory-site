// Minimal Cosmic Courier game implementation with improved graphics
// Canvas with id="game" expected in HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // --- Game state ---
  const state = {
    ship: { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: 0, radius: 12, fuel: 100 },
    stations: [],
    asteroids: [],
    stars: [], // background starfield
    cargo: null, // {stationIndex}
    score: 0,
    keys: {},
    running: true,
    thrusting: false,
  };

  // Create starfield for a deeper space feel
  const createStars = (count) => {
    for (let i = 0; i < count; i++) {
      state.stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
    }
  };
  createStars(120);

  // Utility

// Utility
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Populate stations and asteroids
  const createStations = (n) => {
    for (let i = 0; i < n; i++) {
      state.stations.push({ x: rand(50, W - 50), y: rand(50, H - 50), radius: 15, hasCargo: i === 0 });
    }
  };
  const createAsteroids = (n) => {
    for (let i = 0; i < n; i++) {
      const a = { x: rand(0, W), y: rand(0, H), r: rand(8, 20), vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5) };
      state.asteroids.push(a);
    }
  };
  createStations(3);
  createAsteroids(10);

  // Input handling
  window.addEventListener('keydown', (e) => (state.keys[e.key] = true));
  window.addEventListener('keyup', (e) => (state.keys[e.key] = false));

  // Game loop
  const update = (dt) => {
    const s = state.ship;
    // Fuel consumption
    if (s.fuel <= 0) state.running = false;

    // Simple thrust control
    const thrust = 0.05;
    let thrusting = false;
    if (state.keys['ArrowUp'] || state.keys['w']) { s.vx += Math.cos(s.angle) * thrust; s.vy += Math.sin(s.angle) * thrust; s.fuel -= 0.02; thrusting = true; }
    if (state.keys['ArrowDown'] || state.keys['s']) { s.vx -= Math.cos(s.angle) * thrust; s.vy -= Math.sin(s.angle) * thrust; s.fuel -= 0.01; }
    if (state.keys['ArrowLeft'] || state.keys['a']) { s.angle -= 0.03; }
    if (state.keys['ArrowRight'] || state.keys['d']) { s.angle += 0.03; }
    // Play thrust sound when starting thrust
    if (thrusting && !state.prevThrust) {
      playBeep(300, 0.05);
    }
    state.prevThrust = thrusting;
    state.thrusting = thrusting;
    // Apply friction and move
    s.vx *= 0.99; s.vy *= 0.99;
    s.x = (s.x + s.vx + W) % W;
    s.y = (s.y + s.vy + H) % H;

    // Asteroid movement
    for (const a of state.asteroids) {
      a.x = (a.x + a.vx + W) % W;
      a.y = (a.y + a.vy + H) % H;
      // Ship-asteroid collision
      if (dist(s, a) < s.radius + a.r) {
        state.running = false;
        playBeep(150, 0.5);
      }
    }

    // Cargo pickup/delivery
    for (const st of state.stations) {
      if (dist(s, st) < s.radius + st.radius) {
        if (state.cargo === null && st.hasCargo) {
          state.cargo = { stationIndex: state.stations.indexOf(st) };
          st.hasCargo = false;
          playBeep(600, 0.2);
        } else if (state.cargo !== null && !st.hasCargo) {
          // Deliver to next station
          const targetIdx = (state.cargo.stationIndex + 1) % state.stations.length;
          if (state.stations[targetIdx] === st) {
            state.score += 10;
            state.ship.fuel = Math.min(state.ship.fuel + 20, 100);
            state.cargo = null;
            // Mark new cargo at next station
            const nextIdx = (targetIdx + 1) % state.stations.length;
            state.stations[nextIdx].hasCargo = true;
            playBeep(800, 0.2);
          }
        }
      }
    }
  };

  const draw = () => {
    // Draw background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#00102a');
    grad.addColorStop(1, '#000014');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw starfield
    ctx.fillStyle = 'white';
    for (const star of state.stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw stations with glow
    for (const st of state.stations) {
      ctx.save();
      const glow = ctx.createRadialGradient(st.x, st.y, st.radius, st.x, st.y, st.radius * 4);
      glow.addColorStop(0, st.hasCargo ? 'rgba(255,215,0,0.8)' : 'rgba(100,100,100,0.6)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = st.hasCargo ? '#ffd700' : '#777777';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw asteroids with shading
    for (const a of state.asteroids) {
      const gradA = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      gradA.addColorStop(0, '#555555');
      gradA.addColorStop(1, '#111111');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship with thrust flame
    const s = state.ship;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    // Ship body
    ctx.fillStyle = '#00bfff';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when accelerating
    if (state.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // UI overlay
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(state.ship.fuel)}`, 10, 40);
    if (!state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  };

  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    if (state.running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
