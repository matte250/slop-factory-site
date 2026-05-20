// Orbit Runner – minimal implementation
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ----- Audio setup -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playCollectSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playCrashSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }

  // ----- Game entities -----
  const ship = {
    x: W / 2,
    y: H / 2,
    r: 10,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.07,
    fuel: 100,
  };

  // star field for background
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + 0.5 });
  }

  const asteroids = [];
  const asteroidCount = 8;
  const center = { x: W / 2, y: H / 2 };
  for (let i = 0; i < asteroidCount; i++) {
    const radius = 20 + Math.random() * 30;
    const angle = (Math.PI * 2 * i) / asteroidCount;
    const speed = 0.3 + Math.random() * 0.4;
    // use texture‑like random polygon radius
    asteroids.push({ radius, angle, speed, r: 15 + Math.random() * 10 });
  }

  const fuels = [];
  const fuelCount = 5;
  for (let i = 0; i < fuelCount; i++) {
    fuels.push({ x: Math.random() * W, y: Math.random() * H, r: 6, value: 30 });
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helpers -----
  function circleCollision(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy < (ar + br) * (ar + br);
  }

  // ----- Main loop -----
  let gameOver = false;
  function update() {
    if (gameOver) return;
    // ensure audio context is running after first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    const thrusting = keys['ArrowUp'] && ship.fuel > 0;
    if (thrusting) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel = Math.max(0, ship.fuel - 0.2);
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // fuel drain over time
    ship.fuel = Math.max(0, ship.fuel - 0.05);
    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // wrap around edges
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;

    // update asteroids (orbit around center)
    for (const a of asteroids) {
      a.angle += a.speed * 0.01;
      a.x = center.x + Math.cos(a.angle) * a.radius;
      a.y = center.y + Math.sin(a.angle) * a.radius;
      // collision with ship
      if (circleCollision(ship.x, ship.y, ship.r, a.x, a.y, a.r)) {
        gameOver = true;
        stopThrustSound();
        playCrashSound();
      }
    }

    // fuel cells collection
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (circleCollision(ship.x, ship.y, ship.r, f.x, f.y, f.r)) {
        ship.fuel = Math.min(100, ship.fuel + f.value);
        fuels.splice(i, 1);
        playCollectSound();
      }
    }
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    // thrust flame
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    // asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // fuel cells with glow
    for (const f of fuels) {
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      glow.addColorStop(0, '#ff0');
      glow.addColorStop(1, '#880');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
