// Simple Space Debris Dodge game with improved graphics
// Canvas with id="game" must exist in the HTML.

(() => {
const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Support high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width = canvas.clientWidth * dpr;
  const H = canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  // ----- Ship -----
  const ship = {
    x: W / 2,
    y: H / 2,
    angle: 0, // radians
    radius: 12,
    speed: 0,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    friction: 0.98,
  };

  const keys = {};
  window.addEventListener('keydown', e => { audioCtx.resume && audioCtx.resume(); keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Debris -----
  const debris = [];
  const debrisRadius = 8;
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // ----- Score -----
  let score = 0;
  let lastTime = 0;

  function spawnDebris(time) {
    // Choose random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * H; }
    else if (side === 1) { x = W; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = 0; }
    else { x = Math.random() * W; y = H; }
    // Direction towards center
    const dx = W / 2 - x;
    const dy = H / 2 - y;
    const len = Math.hypot(dx, dy);
    const speed = 1 + Math.random() * 0.5 + score * 0.001; // slight increase with score
    debris.push({ x, y, vx: (dx / len) * speed, vy: (dy / len) * speed, radius: debrisRadius });
  }

  function update(dt) {
    // Update star twinkling
    updateStars();
    // Ship controls (W/ArrowUp thrust, A/Left rotate left, D/Right rotate right)
  // Simple sound helper using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Thrust sound parameters
  const THRUST_FREQ = 200;
  const THRUST_DURATION = 80; // ms
  // Explosion sound parameters
  const EXPLOSION_FREQ = 100;
  const EXPLOSION_DURATION = 500;

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) ship.angle -= 0.07;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) ship.angle += 0.07;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // Play thrust sound
      playTone(THRUST_FREQ, THRUST_DURATION);
    }
    // Apply friction
    ship.vx *= ship.friction;
    ship.vy *= ship.friction;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep ship within bounds (wrap)
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;

    // Update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x += d.vx;
      d.y += d.vy;
      // Remove if out of bounds (with margin)
      if (d.x < -50 || d.x > W + 50 || d.y < -50 || d.y > H + 50) {
        debris.splice(i, 1);
        continue;
      }
      // Collision with ship (simple circle vs point distance)
      const dx = d.x - ship.x;
      const dy = d.y - ship.y;
      if (Math.hypot(dx, dy) < d.radius + ship.radius) {
        // Game over
        playTone(EXPLOSION_FREQ, EXPLOSION_DURATION);
        alert('Game Over! Score: ' + Math.floor(score));
        // Reset state
        ship.x = W / 2; ship.y = H / 2; ship.vx = ship.vy = 0; ship.angle = 0;
        debris.length = 0;
        score = 0;
        return;
      }
    }

    // Increment score over time
    score += dt * 0.01;
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Stars with twinkle
    stars.forEach(s => {
      const brightness = 0.6 + 0.4 * s.twinkle; // 0.6-1.0
      ctx.fillStyle = `rgba(200,200,200,${brightness})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // ctx.clearRect removed – background already drawn
    // Draw ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship gradient (glowing cyan)
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, ship.radius);
    grad.addColorStop(0, '#5ff');
    grad.addColorStop(1, '#0ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    // Outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw debris with gradient
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(d.x, d.y, 1, d.x, d.y, d.radius);
      grad.addColorStop(0, '#faa');
      grad.addColorStop(1, '#f33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (timestamp - lastSpawn > spawnInterval) {
      spawnDebris(timestamp);
      lastSpawn = timestamp;
    }
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
