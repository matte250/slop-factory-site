// Simple Orbit Escape game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Ship state
  const ship = {
    x: W / 2,
    y: H * 0.8,
    angle: 0,
    radius: 10,
    thrust: 0,
    vx: 0,
    vy: 0,
    fuel: 100,
    shield: false,
  };

const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  // Unlock audio on first interaction
  if (!audioUnlocked) {
    unlockAudio();
    audioUnlocked = true;
  }
});
addEventListener('keyup', e => (keys[e.code] = false));
// Sound management
let audioUnlocked = false;
function unlockAudio() {
  // Play a silent sound to satisfy user gesture requirement
  const unlock = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  unlock.play();
}
const thrustAudio = new Audio('https://cdn.jsdelivr.net/gh/freecodecamp/cdn@main/sound/beep.wav');
thrustAudio.loop = true;
const pickupAudio = new Audio('https://cdn.jsdelivr.net/gh/freecodecamp/cdn@main/sound/powerup.wav');
const explosionAudio = new Audio('https://cdn.jsdelivr.net/gh/freecodecamp/cdn@main/sound/explosion.wav');
const gameOverAudio = new Audio('https://cdn.jsdelivr.net/gh/freecodecamp/cdn@main/sound/gameover.wav');

  // Asteroids, pickups, and stars
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + 1 });
  }
  const shipTrail = [];
  const MAX_TRAIL = 12;
  // Asteroids & pickups
  const asteroids = [];
  const pickups = [];

  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    asteroids.push({ x: Math.random() * W, y: -size, r: size, speed: 1 + Math.random() * 2 });
  }
  function spawnPickup() {
    const type = Math.random() < 0.5 ? 'fuel' : 'shield';
    pickups.push({ x: Math.random() * W, y: -20, r: 8, type, speed: 1.5 });
  }
  let spawnTimer = 0;

  function update(dt) {
    // Update ship trail
    shipTrail.push({ x: ship.x, y: ship.y, angle: ship.angle });
    if (shipTrail.length > MAX_TRAIL) shipTrail.shift();
    // Controls
    if (keys['ArrowLeft']) ship.angle -= 0.06 * dt;
    if (keys['ArrowRight']) ship.angle += 0.06 * dt;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.thrust = 0.1;
      ship.fuel -= 0.02 * dt;
      if (thrustAudio.paused) thrustAudio.play();
    } else {
      ship.thrust = 0;
      thrustAudio.pause();
      thrustAudio.currentTime = 0;
    }
    // Apply thrust
    ship.vx += Math.cos(ship.angle) * ship.thrust * dt;
    ship.vy += Math.sin(ship.angle) * ship.thrust * dt;
    // Simple drag
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Keep on screen
    if (ship.x < 0) ship.x = W;
    if (ship.x > W) ship.x = 0;
    if (ship.y < 0) ship.y = H;
    if (ship.y > H) ship.y = H;

    // Spawn objects
    spawnTimer += dt;
    if (spawnTimer > 1500) {
      spawnAsteroid();
      if (Math.random() < 0.3) spawnPickup();
      spawnTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt;
      if (a.y - a.r > H) asteroids.splice(i, 1);
      // Collision
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.radius) {
        if (ship.shield) { ship.shield = false; asteroids.splice(i, 1); }
        else { gameOver(); return; }
      }
    }
    // Update pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.y += p.speed * dt;
      if (p.y - p.r > H) pickups.splice(i, 1);
      const dx = p.x - ship.x, dy = p.y - ship.y;
      if (Math.hypot(dx, dy) < p.r + ship.radius) {
        if (p.type === 'fuel') ship.fuel = Math.min(100, ship.fuel + 30);
        else ship.shield = true;
        pickups.splice(i, 1);
      }
    }
  }

  let last = performance.now();
  let running = true;
  function loop() {
    if (!running) return;
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars (twinkling)
    stars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.random() * 0.5) + ')';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    // Ship trail
    for (let i = 0; i < shipTrail.length; i++) {
      const t = shipTrail[i];
      const alpha = i / shipTrail.length * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -5);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
      ctx.restore();
    }
    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
    grad.addColorStop(0, ship.shield ? 'cyan' : 'lightgray');
    grad.addColorStop(1, ship.shield ? '#0044ff' : 'gray');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids
    asteroids.forEach(a => {
      const gradA = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      gradA.addColorStop(0, '#777');
      gradA.addColorStop(1, '#333');
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = gradA;
      ctx.fill();
    });
    // Pickups
    pickups.forEach(p => {
      ctx.save();
      ctx.shadowColor = p.type === 'fuel' ? 'lime' : 'orange';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'fuel' ? 'lime' : 'orange';
      ctx.fill();
      ctx.restore();
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel.toFixed(0))}`, 10, 20);
  }



  function gameOver() {
    running = false;
    ctx.fillStyle = 'red';
    ctx.font = '36px sans-serif';
    ctx.fillText('Game Over', W / 2 - 80, H / 2);
  }

  // Start loop
  requestAnimationFrame(loop);
})();
