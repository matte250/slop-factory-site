// Minimal Orbit Dodge game based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const playThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  };
  const playPickup = () => {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  const playCrash = () => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };

  // ----- Game state -----
  const ship = { x: W/2, y: H/2, r: 15, angle: 0, speed: 0, fuel: 100, thrusting: false };
  const asteroids = [];
  const fuels = [];
  const keys = {};
  // generate static starfield
  const stars = Array.from({length: 100}, () => ({x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.5}));
  const planet = {x: W/2, y: H/2, r: 80};
  let last = performance.now();
  let running = true;

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const circleCollide = (a, b) => dist(a, b) < a.r + b.r;

  // ----- Input -----
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => keys[e.code] = false);

  // ----- Game loop -----
  function update(dt) {
    if (!running) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= 3 * dt;
    if (keys['ArrowRight']) ship.angle += 3 * dt;
    if (keys['ArrowUp']) {
      ship.speed = 200; // thrust
      ship.fuel = Math.max(0, ship.fuel - 30 * dt);
      ship.thrusting = true;
      playThrust();
    } else {
      ship.speed *= 0.98; // friction
      ship.thrusting = false;
      stopThrust();
    }
    // Move ship
    ship.x += Math.cos(ship.angle) * ship.speed * dt;
    ship.y += Math.sin(ship.angle) * ship.speed * dt;
    // wrap around edges
    if (ship.x < 0) ship.x += W; else if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H; else if (ship.y > H) ship.y -= H;
    // Spawn asteroids
    if (Math.random() < 0.02) {
      const a = {
        x: rand(0, W), y: rand(0, H), r: rand(10, 30),
        vx: rand(-50, 50), vy: rand(-50, 50)
      };
      asteroids.push(a);
    }
    // Spawn fuel pickups
    if (Math.random() < 0.005) {
      fuels.push({ x: rand(0, W), y: rand(0, H), r: 8 });
    }
    // Update asteroids
    asteroids.forEach((a, i) => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < -a.r) a.x = W + a.r;
      if (a.x > W + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = H + a.r;
      if (a.y > H + a.r) a.y = -a.r;
      // collision with ship
      if (circleCollide(ship, a)) {
        playCrash();
        running = false;
      }
    });
    // Check fuel pickups
    fuels.forEach((f, i) => {
      if (circleCollide(ship, f)) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        fuels.splice(i, 1);
      }
    });
    // Lose condition: out of fuel
    if (ship.fuel <= 0) running = false;
  }

  function draw() {
    // Space background gradient
    const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Planet (radial gradient)
    const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.r*0.2, planet.x, planet.y, planet.r);
    planetGrad.addColorStop(0, '#4a7c59');
    planetGrad.addColorStop(1, '#2e4b32');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // Ship (with thrust flame)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // thrust flame
    if (ship.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-22, -6);
      ctx.lineTo(-22, 6);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    // ship body
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.strokeStyle = '#0c0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    // Asteroids (shaded)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel pickups (glowing)
    fuels.forEach(f => {
      const glow = ctx.createRadialGradient(f.x, f.y, f.r*0.2, f.x, f.y, f.r);
      glow.addColorStop(0, '#ff0');
      glow.addColorStop(1, '#aa0');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(5, 5, 100, 30);
    // HUD text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + ship.fuel.toFixed(0), 10, 25);
    if (!running) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W/2 - 120, H/2);
    }
  }

  function loop(ts) {
    const dt = (ts - last) / 1000;
    last = ts;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
