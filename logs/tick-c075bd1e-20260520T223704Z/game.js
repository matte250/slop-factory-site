// Space Debris Dodge
// Canvas with id="game" must exist in the HTML.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Ship definition
const ship = {
  // (no sound code here)
};

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioStarted = false;
function ensureAudioStarted() {
  if (!audioStarted) {
    audioCtx.resume();
    audioStarted = true;
  }
}
function playBeep(freq, duration = 0.1) {
  ensureAudioStarted();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playBoostSound() { playBeep(600, 0.15); }
function playClearSound() { playBeep(300, 0.2); }
function playCrashSound() { playBeep(100, 0.4); }
  width: 30,
  height: 20,
  x: canvas.width / 2,
  y: canvas.height - 40,
  speed: 4,
  boostTimer: 0,
  draw() {
    // ship as a gradient‑filled triangle
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.width / 2, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
};

let debris = [];
let powerUps = [];
let score = 0;
let gameOver = false;
let spawnCounter = 0;
let powerCounter = 0;

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function spawnDebris() {
  const size = Math.random() * 20 + 10;
  debris.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 2 + Math.random() * 2 + score / 1000 // accelerate with score
  });
}

function spawnPowerUp() {
  const type = Math.random() < 0.5 ? 'boost' : 'clear';
  powerUps.push({
    x: Math.random() * (canvas.width - 20),
    y: -20,
    size: 20,
    speed: 2,
    type
  });
}

function update() {
  if (gameOver) return;

  // Move ship
  if (keys.ArrowLeft) ship.x -= ship.speed;
  if (keys.ArrowRight) ship.x += ship.speed;
  if (keys.ArrowUp) ship.y -= ship.speed;
  if (keys.ArrowDown) ship.y += ship.speed;
  // Keep inside canvas
  ship.x = Math.max(ship.width / 2, Math.min(canvas.width - ship.width / 2, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));

  // Boost timer decrement
  if (ship.boostTimer > 0) ship.boostTimer--;

  // Spawn debris gradually
  spawnCounter++;
  if (spawnCounter > 30) { // roughly every 0.5 sec at 60fps
    spawnDebris();
    spawnCounter = 0;
  }

  // Occasionally spawn power‑ups
  powerCounter++;
  if (powerCounter > 600) { // every ~10 sec
    spawnPowerUp();
    powerCounter = 0;
  }

  // Update debris positions
  debris.forEach(d => d.y += d.speed);
  // Remove off‑screen debris and increase score
  debris = debris.filter(d => {
    if (d.y - d.size > canvas.height) {
      score++;
      return false;
    }
    return true;
  });

  // Update power‑ups
  powerUps.forEach(p => p.y += p.speed);
  powerUps = powerUps.filter(p => p.y - p.size < canvas.height);

  // Collision detection
  const shipRect = {x: ship.x - ship.width / 2, y: ship.y, w: ship.width, h: ship.height};
  for (let i = 0; i < debris.length; i++) {
    const d = debris[i];
if (rectIntersect(shipRect, {x: d.x, y: d.y, w: d.size, h: d.size})) {
        playCrashSound();
        gameOver = true;
        break;
      }
  }
  // Power‑up collection
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    if (rectIntersect(shipRect, {x: p.x, y: p.y, w: p.size, h: p.size})) {
      if (p.type === 'boost') {
        playBoostSound();
        ship.boostTimer = 300; // 5 seconds at 60fps
        ship.speed = 8;
      } else if (p.type === 'clear') {
        playClearSound();
        debris = [];
      }
      powerUps.splice(i, 1);
    }
  }
  // Reset speed after boost ends
  if (ship.boostTimer === 0) ship.speed = 4;
}

function draw() {
  ctx.fillStyle = '#000014';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
    // animated starfield background
  // initialize stars once
  if (!window.stars) {
    window.stars = [];
    for (let i = 0; i < 100; i++) {
      window.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 1.5,
        size: Math.random() * 2 + 1
      });
    }
  }
  // update and draw stars (no background fill here)
  window.stars.forEach(s => {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  ship.draw();

    // Draw debris with gradient shading
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(d.x + d.size/2, d.y + d.size/2, 0, d.x + d.size/2, d.y + d.size/2, d.size/2);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.fillRect(d.x, d.y, d.size, d.size);
    });

    // Draw power‑ups with radial gradient
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(p.x + p.size/2, p.y + p.size/2, 0, p.x + p.size/2, p.y + p.size/2, p.size/2);
      if (p.type === 'boost') {
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#aa0');
      } else {
        grad.addColorStop(0, '#0ff');
        grad.addColorStop(1, '#00a');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

  // Score
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// Start the game
loop();
