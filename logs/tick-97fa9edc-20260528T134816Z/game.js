// Simple canvas game based on IDEA.md – Cosmic Escape
// Assumes there is a <canvas id="game"></canvas> element in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playFreq(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playFreq(200); }
  function playPickup() { playFreq(600); }
  function playExplosion() { playFreq(100, 0.3); }
  // Create a simple starfield for background ambiance
  const STAR_COUNT = 100;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * 0.5 + 0.5,
      });
    }
  }
  initStars();

  // --- Game objects ----------------------------------------------------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    speed: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    friction: 0.98,
    color: '#0ff',
  };

const asteroids = [];
const orbs = [];
const stars = [];
let lastAsteroid = 0;
  let lastOrb = 0;
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  // Helper: random range
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Create an asteroid with random size, position and velocity
  function spawnAsteroid() {
    const radius = rand(15, 40);
    // Spawn off-screen on a random side
    const side = Math.floor(rand(0, 4));
    let x, y;
    if (side === 0) { // left
      x = -radius;
      y = rand(0, canvas.height);
    } else if (side === 1) { // right
      x = canvas.width + radius;
      y = rand(0, canvas.height);
    } else if (side === 2) { // top
      x = rand(0, canvas.width);
      y = -radius;
    } else { // bottom
      x = rand(0, canvas.width);
      y = canvas.height + radius;
    }
    const speed = rand(0.5, 2.5);
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const rotSpeed = rand(-0.03, 0.03); // radians per frame
    const hue = Math.floor(rand(0, 360));
    const color = `hsl(${hue}, 50%, 40%)`;
    asteroids.push({ x, y, radius, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle: 0, rotSpeed, color });
  }

  function spawnOrb() {
    const radius = 8;
    const x = rand(radius, canvas.width - radius);
    const y = rand(radius, canvas.height - radius);
    orbs.push({ x, y, radius, color: '#ff0', collected: false });
  }

  // Input handling
  const keys = {};
  function resumeAudio(){ if (audioCtx.state !== 'running') audioCtx.resume(); }
  window.addEventListener('keydown', e => { resumeAudio(); keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    if (gameOver) return;

    // Ship controls – arrow keys or WASD
    if (keys['ArrowUp'] || keys['w']) { ship.vy -= ship.thrust; playThrust(); }
    if (keys['ArrowDown'] || keys['s']) { ship.vy += ship.thrust; playThrust(); }
    if (keys['ArrowLeft'] || keys['a']) { ship.vx -= ship.thrust; playThrust(); }
    if (keys['ArrowRight'] || keys['d']) { ship.vx += ship.thrust; playThrust(); }

    // Apply friction
    ship.vx *= ship.friction;
    ship.vy *= ship.friction;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Keep ship within bounds (wrap around)
    if (ship.x < -ship.radius) ship.x = canvas.width + ship.radius;
    if (ship.x > canvas.width + ship.radius) ship.x = -ship.radius;
    if (ship.y < -ship.radius) ship.y = canvas.height + ship.radius;
    if (ship.y > canvas.height + ship.radius) ship.y = -ship.radius;

    // Spawn asteroids – difficulty increases over time
    const now = performance.now();
    const difficultyFactor = 1 + (now - startTime) / 60000; // increase each minute
    if (now - lastAsteroid > 1000 / difficultyFactor) {
      spawnAsteroid();
      lastAsteroid = now;
    }

    // Occasionally spawn an orb
    if (now - lastOrb > 5000) {
      spawnOrb();
      lastOrb = now;
    }

    // Update asteroid positions and rotation
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      if (a.rotSpeed) a.angle += a.rotSpeed;
    }

    // Collision detection – ship vs asteroids (circle collision)
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
if (dist < ship.radius + a.radius) {
          playExplosion();
          gameOver = true;
          break;
        }
    }

    // Orbs collection
    for (const o of orbs) {
      if (!o.collected) {
        const dx = ship.x - o.x;
        const dy = ship.y - o.y;
        const dist = Math.hypot(dx, dy);
        if (dist < ship.radius + o.radius) {
          o.collected = true;
          score += 10;
          playPickup();
        }
      }
    }

    // Remove off‑screen asteroids (simple cleanup)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.radius || a.x > canvas.width + a.radius || a.y < -a.radius || a.y > canvas.height + a.radius) {
        asteroids.splice(i, 1);
      }
    }

    // Remove collected orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      if (orbs[i].collected) orbs.splice(i, 1);
    }
  }

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield
    for (const s of stars) {
      // simple twinkle using sine wave based on time and position
      const twinkle = 0.5 + 0.5 * Math.abs(Math.sin(performance.now() / 500 + s.x + s.y));
      ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship as a rotated triangle with simple thrust flame
    // Compute ship angle based on velocity; default upward if stationary
    const shipAngle = Math.atan2(ship.vy, ship.vx) || -Math.PI / 2;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle + Math.PI / 2); // orient triangle forward
    // Ship body
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.6, ship.radius);
    ctx.lineTo(-ship.radius * 0.6, ship.radius);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when accelerating (any key pressed)
    if (keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'] || keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d']) {
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius * 0.3, ship.radius + ship.radius * 1.5);
      ctx.lineTo(-ship.radius * 0.3, ship.radius + ship.radius * 1.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Draw asteroids with subtle gradient shading and rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle || 0);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw orbs with glowing effect
    for (const o of orbs) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,0,0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // UI – score and time
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s  Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
    ctx.restore();

    // Draw asteroids
    for (const a of asteroids) {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw orbs
    for (const o of orbs) {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI – score and time
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s  Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastRender || timestamp);
    lastRender = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  let lastRender = 0;
  requestAnimationFrame(loop);
})();
