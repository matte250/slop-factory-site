// Minimal Space Junk Escape game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth || 800;
canvas.height = canvas.offsetHeight || 600;

// ---------- Audio ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
  osc.start(now);
  osc.stop(now + duration / 1000);
}
function playThrust() { beep(300, 80); }
function playCollision() { beep(100, 200); }
function playPowerUp() { beep(600, 150); }
function playGameOver() { beep(50, 500); }
// Unlock audio on first user interaction
window.addEventListener('keydown', () => { if (audioCtx.state !== 'running') audioCtx.resume(); }, { once: true });

// ---------- Utility ----------
function rand(min, max) { return Math.random() * (max - min) + min; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// ---------- Stars Background ----------
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: rand(0, canvas.width), y: rand(0, canvas.height), r: rand(0.5, 1.5) });
}
function drawStars() {
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    // Slight twinkle by varying radius each frame
    s.r = rand(0.5, 1.5);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---------- Ship ----------
class Ship {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.r = 12; // radius for collision & drawing
    this.angle = 0; // radians
    this.vx = 0; this.vy = 0;
    this.thrust = 0.2;
    this.friction = 0.99;
    this.health = 3;
    this.shield = 0; // frames remaining
    this.thrusting = false; // visual flag
  }
  update() {
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    // Screen wrap
    if (this.x < 0) this.x += canvas.width;
    if (this.x > canvas.width) this.x -= canvas.width;
    if (this.y < 0) this.y += canvas.height;
    if (this.y > canvas.height) this.y -= canvas.height;
    // Friction
    this.vx *= this.friction; this.vy *= this.friction;
    if (this.shield > 0) this.shield--;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(0, -this.r);
    ctx.lineTo(this.r, this.r);
    ctx.lineTo(-this.r, this.r);
    ctx.closePath();
    ctx.fillStyle = this.shield ? 'cyan' : 'white';
    ctx.fill();
    // Thrust flame
    if (this.thrusting) {
      ctx.beginPath();
      ctx.moveTo(0, this.r);
      ctx.lineTo(this.r / 2, this.r + 6);
      ctx.lineTo(-this.r / 2, this.r + 6);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    // Shield halo
    if (this.shield) {
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    // reset thrust visual flag for next frame
    this.thrusting = false;
  }
  thrustForward() {
    this.vx += Math.cos(this.angle) * this.thrust;
    this.vy += Math.sin(this.angle) * this.thrust;
    this.thrusting = true; // trigger flame visual
    playThrust();
  }
  rotate(dir) { // dir = -1 left, +1 right
    this.angle += dir * 0.07;
  }
}

// ---------- Junk (obstacle) ----------
class Junk {
  constructor() {
    this.x = rand(0, canvas.width);
    this.y = -20; // start above view
    this.r = rand(10, 20);
    this.vy = rand(1, 3);
    this.angle = rand(0, Math.PI * 2);
    this.spin = rand(-0.03, 0.03);
    // random metal hue
    const hue = Math.floor(rand(0, 30)); // dark gray/blue metallic
    this.color = `hsl(${hue}, 20%, 40%)`;
  }
  update() { this.y += this.vy; this.angle += this.spin; }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // irregular polygon for asteroid look
    ctx.beginPath();
    const points = 6;
    for (let i = 0; i < points; i++) {
      const theta = (i / points) * Math.PI * 2;
      const rad = this.r * rand(0.7, 1.0);
      ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
  offScreen() { return this.y - this.r > canvas.height; }
}

// ---------- PowerUp ----------
class PowerUp {
  constructor() {
    this.x = rand(0, canvas.width);
    this.y = -20;
    this.r = 8;
    this.vy = 2;
  }
  update() { this.y += this.vy; }
  draw() {
    // Pulsating glow
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 1;
    const radius = this.r * pulse;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
    grad.addColorStop(0, 'rgba(255,215,0,0.8)'); // gold center
    grad.addColorStop(1, 'rgba(255,215,0,0.1)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
  offScreen() { return this.y - this.r > canvas.height; }
}

const ship = new Ship();
let junks = [];
let powerUps = [];
let frames = 0;

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function spawnJunk() { if (Math.random() < 0.03) junks.push(new Junk()); }
function spawnPower() { if (Math.random() < 0.005) powerUps.push(new PowerUp()); }

function checkCollisions() {
  // Junk vs ship
  junks = junks.filter(j => {
    if (dist({x:j.x, y:j.y}, ship) < j.r + ship.r) {
      if (ship.shield === 0) {
        ship.health--;
        playCollision();
      }
      // remove junk on hit
      return false;
    }
    return true;
  });
  // PowerUp vs ship
  powerUps = powerUps.filter(p => {
    if (dist({x:p.x, y:p.y}, ship) < p.r + ship.r) {
      ship.shield = 300; // ~5 seconds at 60fps
      playPowerUp();
      return false;
    }
    return true;
  });
}

function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Health: ' + ship.health, 10, 20);
  if (ship.shield) ctx.fillText('Shield', 10, 40);
}

function gameOver() {
  ctx.fillStyle = 'red';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
}

function loop() {
  // Draw background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001020');
  bgGrad.addColorStop(1,'#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Draw star field
  drawStars();

  // Input handling
  if (keys['ArrowLeft'] || keys['a']) ship.rotate(-1);
  if (keys['ArrowRight'] || keys['d']) ship.rotate(1);
  if (keys['ArrowUp'] || keys['w']) ship.thrustForward();

  ship.update();
  ship.draw();

  // Spawn and update junk
  spawnJunk();
  junks.forEach(j => { j.update(); j.draw(); });
  junks = junks.filter(j => !j.offScreen());

  // Spawn and update power-ups
  spawnPower();
  powerUps.forEach(p => { p.update(); p.draw(); });
  powerUps = powerUps.filter(p => !p.offScreen());

  checkCollisions();
  drawHUD();

  if (ship.health <= 0) {
    gameOver();
  } else {
    requestAnimationFrame(loop);
  }
}

requestAnimationFrame(loop);
