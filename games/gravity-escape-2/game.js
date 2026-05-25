// Gravity Escape – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Planet (center)
  const planet = { x: width / 2, y: height / 2, r: 30, g: 0.4 };

  // Ship state
  const ship = {
    x: width * 0.1,
    y: height * 0.5,
    vx: 0,
    vy: 0,
    size: 8,
    thrust: 0.2,
    color: '#0ff',
  };

  let thrusting = false;
  let startTime = null;
  let gameOver = false;
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const playThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  };
  const playExplosion = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };

  // Input handling (space or ArrowUp)
  const onKey = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      thrusting = e.type === 'keydown';
      if (thrusting) playThrust(); else stopThrust();
    }
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  const update = (dt) => {
    // gravity toward planet (simple inverse‑square)
    const dx = planet.x - ship.x;
    const dy = planet.y - ship.y;
    const dist = Math.hypot(dx, dy);
    const ax = (dx / dist) * (planet.g / (dist * dist));
    const ay = (dy / dist) * (planet.g / (dist * dist));
    ship.vx += ax * dt;
    ship.vy += ay * dt;
    if (thrusting) {
      // thrust away from planet (opposite direction of gravity)
      ship.vx -= ax * ship.thrust * dt * 5;
      ship.vy -= ay * ship.thrust * dt * 5;
    }
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // collision / bounds
    if (!gameOver) {
      if (dist <= planet.r + ship.size) {
        gameOver = true;
        playExplosion();
      }
      if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
        gameOver = true;
        playExplosion();
      }
    }
  };

  // generate background stars once
  const stars = Array.from({length: 120}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.2 + 0.3,
    twinkle: Math.random(),
  }));

  // ship trail particles
  const trail = [];

  const draw = () => {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // twinkling stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      // simple twinkle by modulating radius
      const radius = s.r * (0.8 + 0.2 * Math.abs(Math.sin(performance.now() / 500 + s.twinkle * Math.PI)));
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // planet with radial gradient & subtle glow
    const grad = ctx.createRadialGradient(
      planet.x,
      planet.y,
      planet.r * 0.1,
      planet.x,
      planet.y,
      planet.r
    );
    grad.addColorStop(0, '#ffcc66');
    grad.addColorStop(1, '#663300');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // glow halo
    ctx.strokeStyle = 'rgba(255,200,100,0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // ship trail (fading circles)
    ctx.save();
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      const alpha = Math.max(0, 1 - (performance.now() - p.time) / 300);
      if (alpha <= 0) { trail.splice(i, 1); continue; }
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ship.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ship as triangle pointing direction of motion
    const angle = Math.atan2(ship.vy, ship.vx) || 0;
    const shipSize = ship.size * 2;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(shipSize, 0);
    ctx.lineTo(-shipSize * 0.5, shipSize * 0.5);
    ctx.lineTo(-shipSize * 0.5, -shipSize * 0.5);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-shipSize * 0.5, 0);
      ctx.lineTo(-shipSize * 0.9, shipSize * 0.3);
      ctx.lineTo(-shipSize * 0.9, -shipSize * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // score / status
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) ctx.fillText('Game Over', width / 2 - 40, height / 2);
  };

  const loop = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - (loop.last ?? timestamp)) / 1000; // seconds
    loop.last = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
