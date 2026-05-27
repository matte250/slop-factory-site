// Vortex Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  // ----- audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(300, 100); }
  function playCollision() { playTone(80, 400); }
  // optional background hum
  let humOsc = null;
  function startHum() {
    humOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    humOsc.type = 'triangle';
    humOsc.frequency.value = 30;
    humOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    humOsc.start();
  }
  startHum();
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- ship -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.07,
    color: '#00f'
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  window.addEventListener('keydown', e => { if (e.key in keys) { keys[e.key] = true; if (e.key === 'ArrowUp') playThrust(); } });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- vortexes -----
  const vortexes = [];
  const vortexSpawnInterval = 2000; // ms
  const vortexRadius = 30;
  const maxVortexes = 10;
  let lastSpawn = 0;

  function spawnVortex() {
    if (vortexes.length >= maxVortexes) return;
    const x = Math.random() * width;
    const y = Math.random() * height;
    vortexes.push({ x, y, radius: vortexRadius, color: '#f00' });
  }

  // ----- game state -----
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  function update(dt) {
    // ship rotation
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    // thrust
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // screen wrap
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // vortex pull and collision
    for (const v of vortexes) {
      const dx = v.x - ship.x;
      const dy = v.y - ship.y;
      const dist = Math.hypot(dx, dy);
      // simple pull force
      const pull = 0.02;
      ship.vx += (dx / dist) * pull * dt;
      ship.vy += (dy / dist) * pull * dt;
      // collision
      if (dist < v.radius + ship.radius) {
        if (!gameOver) playCollision();
        gameOver = true;
      }
    }
    // score
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  // pre‑generated star field
const stars = Array.from({length: 200}, () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 1.5 + 0.5
}));

// ship trail buffer
const trail = [];
const maxTrail = 20;

function draw() {
    // dark space background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw vortexes with radial gradient
    for (const v of vortexes) {
      const gradient = ctx.createRadialGradient(v.x, v.y, v.radius * 0.1, v.x, v.y, v.radius);
      gradient.addColorStop(0, 'rgba(255,0,0,0.8)');
      gradient.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    // update trail
    trail.push({x: ship.x, y: ship.y});
    if (trail.length > maxTrail) trail.shift();
    // draw ship trail
    ctx.strokeStyle = 'rgba(0,0,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const alpha = i / trail.length;
      ctx.strokeStyle = `rgba(0,0,255,${0.2 + 0.6 * alpha})`;
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    // draw ship (triangle) with subtle gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-10, 0, 15, 0);
    shipGrad.addColorStop(0, '#00a');
    shipGrad.addColorStop(1, '#0ff');
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.restore();
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - (lastFrame ?? timestamp)) / 16; // normalize to 60fps factor
    lastFrame = timestamp;
    if (!gameOver) {
      update(dt);
      if (timestamp - lastSpawn > vortexSpawnInterval) {
        spawnVortex();
        lastSpawn = timestamp;
      }
    }
    draw();
    requestAnimationFrame(loop);
  }
  let lastFrame;
  requestAnimationFrame(loop);
})();
