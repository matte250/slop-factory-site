// Game based on IDEA.md – Meteor Dodge
// Canvas with id="game"
// ----- Audio -----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// ----- Starfield -----
const stars = [];
function initStars(count = 200) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    });
  }
}
initStars();

// ----- Player -----
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 12,
  angle: 0,
  vx: 0,
  vy: 0,
  thrust: 0.1,
  rotSpeed: 0.08,
  fuel: 100,
};

// ----- Input -----
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'ArrowUp') playTone(400, 0.05);
});
window.addEventListener('keyup', e => (keys[e.key] = false));

// ----- Meteors -----
const meteors = [];
function spawnMeteor() {
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = 1 + Math.random() * 1.5 + meteors.length * 0.02;
  if (edge === 0) { // top
    x = Math.random() * canvas.width; y = -20; vx = (canvas.width/2 - x) * 0.001; vy = speed;
  } else if (edge === 1) { // bottom
    x = Math.random() * canvas.width; y = canvas.height + 20; vx = (canvas.width/2 - x) * 0.001; vy = -speed;
  } else if (edge === 2) { // left
    x = -20; y = Math.random() * canvas.height; vx = speed; vy = (canvas.height/2 - y) * 0.001;
  } else { // right
    x = canvas.width + 20; y = Math.random() * canvas.height; vx = -speed; vy = (canvas.height/2 - y) * 0.001;
  }
  meteors.push({x, y, vx, vy, r: 15 + Math.random()*10});
}
let meteorTimer = 0;

// ----- Fuel Canisters -----
const fuels = [];
function spawnFuel() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  fuels.push({x, y, r: 8});
}
let fuelTimer = 0;

function update(dt) {
  // Controls
  if (keys.ArrowLeft) ship.angle -= ship.rotSpeed;
  if (keys.ArrowRight) ship.angle += ship.rotSpeed;
  if (keys.ArrowUp && ship.fuel > 0) {
    ship.vx += Math.cos(ship.angle) * ship.thrust;
    ship.vy += Math.sin(ship.angle) * ship.thrust;
    ship.fuel -= 0.05;
  }
  // Move ship
  ship.x += ship.vx; ship.y += ship.vy;
  // Simple friction
  ship.vx *= 0.99; ship.vy *= 0.99;
  // Keep inside canvas (wrap)
  if (ship.x < 0) ship.x = canvas.width;
  if (ship.x > canvas.width) ship.x = 0;
  if (ship.y < 0) ship.y = canvas.height;
  if (ship.y > canvas.height) ship.y = 0;

  // Meteors
  meteorTimer += dt;
  if (meteorTimer > 1000) { spawnMeteor(); meteorTimer = 0; }
  meteors.forEach(m => { m.x += m.vx; m.y += m.vy; });
  // Remove off‑screen meteors
  for (let i = meteors.length-1; i>=0; i--) {
    const m = meteors[i];
    if (m.x < -50 || m.x > canvas.width+50 || m.y < -50 || m.y > canvas.height+50) meteors.splice(i,1);
  }

  // Fuel canisters
  fuelTimer += dt;
  if (fuelTimer > 5000) { spawnFuel(); fuelTimer = 0; }
  // Collision ship‑fuel
  for (let i = fuels.length-1; i>=0; i--) {
    const f = fuels[i];
    const d = Math.hypot(ship.x-f.x, ship.y-f.y);
    if (d < ship.r + f.r) { ship.fuel = Math.min(100, ship.fuel + 30); fuels.splice(i,1); playTone(600,0.05); }
  }

  // Collision ship‑meteor
  for (const m of meteors) {
    const d = Math.hypot(ship.x-m.x, ship.y-m.y);
    if (d < ship.r + m.r) { gameOver(); return; }
  }
}

let score = 0;
let lastTime = performance.now();
let running = true;
function gameOver() {
  playTone(100, 0.3); // low crash tone
  running = false;
  alert(`Game Over! Score: ${Math.floor(score)}s`);
}

// ----- Graphics -----
function drawBackground() {
  // starfield background
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#555';
  for (let i=0;i<stars.length;i++){
    const s=stars[i];
    ctx.fillRect(s.x,s.y,1,1);
    s.x+=s.vx; s.y+=s.vy;
    if(s.x<0||s.x>canvas.width||s.y<0||s.y>canvas.height){s.x=Math.random()*canvas.width; s.y=Math.random()*canvas.height;}
  }
}

function drawShip(){
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // ship body gradient
  const grad=ctx.createLinearGradient(ship.r,0,-ship.r,0);
  grad.addColorStop(0,'#0f0');
  grad.addColorStop(1,'#004400');
  ctx.fillStyle=grad;
  ctx.beginPath();
  ctx.moveTo(ship.r,0);
  ctx.lineTo(-ship.r/2, ship.r/2);
  ctx.lineTo(-ship.r/2, -ship.r/2);
  ctx.closePath();
  ctx.fill();
  // thrust flame when accelerating
  if(keys.ArrowUp && ship.fuel>0){
    ctx.fillStyle='orange';
    ctx.beginPath();
    ctx.moveTo(-ship.r/2,0);
    ctx.lineTo(-ship.r-8, ship.r/3);
    ctx.lineTo(-ship.r-8, -ship.r/3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMeteor(m){
  const grad=ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.r);
  grad.addColorStop(0,'#aaa');
  grad.addColorStop(1,'#333');
  ctx.fillStyle=grad;
  ctx.beginPath();
  ctx.arc(m.x,m.y,m.r,0,Math.PI*2);
  ctx.fill();
}

function drawFuel(f){
  const grad=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r);
  grad.addColorStop(0,'#ff0');
  grad.addColorStop(1,'#aa6600');
  ctx.fillStyle=grad;
  ctx.beginPath();
  ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
  ctx.fill();
}

function drawHUD(){
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 20);
  ctx.fillText(`Score: ${Math.floor(score)}s`, 10, 40);
}

function draw(){
  drawBackground();
  drawShip();
  ctx.fillStyle = '#888'; // fallback for any remaining meteors if gradient fails
  for (const m of meteors) { drawMeteor(m); }
  for (const f of fuels) { drawFuel(f); }
  drawHUD();
}

  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(ship.r,0);
  ctx.lineTo(-ship.r/2, ship.r/2);
  ctx.lineTo(-ship.r/2, -ship.r/2);
  ctx.closePath();
  ctx.fillStyle = '#0f0';
  ctx.fill();
  ctx.restore();

  // Meteors
  ctx.fillStyle = '#888';
  for (const m of meteors) {
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI*2);
    ctx.fill();
  }

  // Fuel canisters
  ctx.fillStyle = '#ff0';
  for (const f of fuels) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
    ctx.fill();
  }

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 20);
  ctx.fillText(`Score: ${Math.floor(score)}s`, 10, 40);
}

function loop(now) {
  const dt = now - lastTime;
  lastTime = now;
  if (running) {
    update(dt);
    score += dt/1000;
    draw();
    requestAnimationFrame(loop);
  }
}
requestAnimationFrame(loop);
