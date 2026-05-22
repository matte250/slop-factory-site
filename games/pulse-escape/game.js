// Simple Asteroid Miner game
// Canvas with id="game" must exist in the HTML.
const canvas = document.getElementById('game');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function resumeAudio(){ if(audioCtx.state==='suspended'){ audioCtx.resume(); } }
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  // quick envelope
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Game objects
const ship = { x: canvas.width / 2, y: canvas.height / 2, size: 20, speed: 3, vx: 0, vy: 0, angle: 0 };
// background stars
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 1 });
}
let ores = [];
let asteroid = { x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: 30, vx: 2, vy: 1.5 };
let score = 0;
let gameOver = false;

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; resumeAudio(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });

function spawnOre() {
  const r = 10;
  const x = Math.random() * (canvas.width - 2 * r) + r;
  const y = Math.random() * (canvas.height - 2 * r) + r;
  ores.push({ x, y, r });
}
// initial ores
for (let i = 0; i < 5; i++) spawnOre();

function update() {
  // move ship based on input
  ship.vx = ship.vy = 0;
  if (keys['ArrowLeft']) ship.vx = -ship.speed;
  if (keys['ArrowRight']) ship.vx = ship.speed;
  if (keys['ArrowUp']) ship.vy = -ship.speed;
  if (keys['ArrowDown']) ship.vy = ship.speed;
  // set ship angle when moving
  if (ship.vx !== 0 || ship.vy !== 0) {
    ship.angle = Math.atan2(ship.vy, ship.vx);
  }
  ship.x = Math.max(0, Math.min(canvas.width, ship.x + ship.vx));
  ship.y = Math.max(0, Math.min(canvas.height, ship.y + ship.vy));

  // move asteroid
  asteroid.x += asteroid.vx;
  asteroid.y += asteroid.vy;
  if (asteroid.x < asteroid.r || asteroid.x > canvas.width - asteroid.r) asteroid.vx *= -1;
  if (asteroid.y < asteroid.r || asteroid.y > canvas.height - asteroid.r) asteroid.vy *= -1;

  // check ore collection
  ores = ores.filter(o => {
    const dx = o.x - ship.x;
    const dy = o.y - ship.y;
    if (Math.hypot(dx, dy) < o.r + ship.size / 2) {
      score++;
      spawnOre(); // replace collected ore
      return false;
    }
    return true;
  });

  // check collision with asteroid
  const dx = asteroid.x - ship.x;
  const dy = asteroid.y - ship.y;
  if (Math.hypot(dx, dy) < asteroid.r + ship.size / 2) {
    gameOver = true;
  }
}

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001035');
  bgGrad.addColorStop(1,'#000815');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  ctx.fillStyle = 'white';
  stars.forEach(s=>{ ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();});
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ship (triangle pointing direction)
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.moveTo(ship.size/2, 0);
  ctx.lineTo(-ship.size/2, ship.size/3);
  ctx.lineTo(-ship.size/2, -ship.size/3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ores (glowing)
  ores.forEach(o => {
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(1, '#b8860b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // asteroid
  ctx.fillStyle = 'gray';
  ctx.beginPath();
  ctx.arc(asteroid.x, asteroid.y, asteroid.r, 0, Math.PI * 2);
  ctx.fill();

  // score
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
  }
}

function loop() {
  if (!gameOver) update();
  draw();
  requestAnimationFrame(loop);
}
loop();

// Expose for debugging (optional)
window.gameState = { ship, ores, asteroid, score, gameOver };
