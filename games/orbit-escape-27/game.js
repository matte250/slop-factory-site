// Simple Orbit Escape game
// Canvas with id="game"
const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas #game not found');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Game settings
const PLANET = {x: canvas.width/2, y: canvas.height/2, radius: 40};
const SHIP = {angle: 0, radius: 100, size: 10, thrust: 0, fuel: 100};
const ASTEROID_COUNT = 5;
const FUEL_COUNT = 3;
const TIME_LIMIT = 60; // seconds

let asteroids = [];
let fuels = [];
let score = 0;
let startTime = null;
let keys = {};

function rand(min, max) {return Math.random()*(max-min)+min;}
function init() {
  // starfield background
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  // spawn asteroids on random circular orbits, with rough shape
  for (let i=0;i<ASTEROID_COUNT;i++) {
    const r = rand(80, 200);
    const a = rand(0, Math.PI*2);
    const speed = rand(0.001, 0.003);
    // generate simple polygon offsets for asteroid shape
    const points = [];
    const sides = Math.floor(rand(5,9));
    for (let s=0;s<sides;s++) {
      const angle = (s/sides)*Math.PI*2;
      const offset = rand(0.7,1.3);
      points.push({angle, offset});
    }
    asteroids.push({angle:a, radius:r, speed, size:12, points});
  }
  // spawn fuel cells
  for (let i=0;i<FUEL_COUNT;i++) {
    const r = rand(80, 200);
    const a = rand(0, Math.PI*2);
    fuels.push({angle:a, radius:r, size:8, collected:false});
  }
  startTime = Date.now();
  requestAnimationFrame(loop);
}

function update(dt) {
  // ensure audio context is running (required after user gesture)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // handle input
  if (keys['ArrowLeft']) SHIP.angle -= 0.003*dt;
  if (keys['ArrowRight']) SHIP.angle += 0.003*dt;
  if (keys['ArrowUp'] && SHIP.fuel>0) {
    SHIP.thrust = 0.05;
    SHIP.fuel -= dt*0.02;
  } else {
    SHIP.thrust = 0;
  }
  // apply thrust to radius
  SHIP.radius += SHIP.thrust*dt;
  // keep within bounds
  if (SHIP.radius < PLANET.radius+20) SHIP.radius = PLANET.radius+20;
  if (SHIP.radius > Math.min(canvas.width,canvas.height)/2-20) SHIP.radius = Math.min(canvas.width,canvas.height)/2-20;

  // move asteroids
  asteroids.forEach(a=>{a.angle+=a.speed*dt;});
  // move fuels (slow rotation)
  fuels.forEach(f=>{f.angle+=0.0005*dt;});

  // collision detection
  const shipPos = polarToCart(SHIP.angle, SHIP.radius);
  // asteroids
  for (let a of asteroids) {
    const p = polarToCart(a.angle, a.radius);
    if (dist(p, shipPos) < a.size/2 + SHIP.size/2) {
      endGame('collision');
      return;
    }
  }
  // fuel cells
  for (let f of fuels) {
    if (f.collected) continue;
    const p = polarToCart(f.angle, f.radius);
    if (dist(p, shipPos) < f.size/2 + SHIP.size/2) {
      f.collected = true;
      SHIP.fuel += 30;
      score += 10;
      playSound(400, 'square', 0.1); // fuel pickup
    }
  }
  // time limit
  const elapsed = (Date.now()-startTime)/1000;
  if (elapsed >= TIME_LIMIT) endGame('time');
}

function draw() {
  // clear background
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // starfield
  ctx.fillStyle = 'white';
  stars && stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
    ctx.fill();
  });
  // planet with gradient
  const grad = ctx.createRadialGradient(PLANET.x, PLANET.y, PLANET.radius*0.2, PLANET.x, PLANET.y, PLANET.radius);
  grad.addColorStop(0, '#777');
  grad.addColorStop(1, '#222');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(PLANET.x, PLANET.y, PLANET.radius, 0, Math.PI*2);
  ctx.fill();
  // ship with outline
  const shipPos = polarToCart(SHIP.angle, SHIP.radius);
  ctx.save();
  ctx.translate(shipPos.x, shipPos.y);
  ctx.rotate(SHIP.angle+Math.PI/2);
  ctx.fillStyle = '#0f0';
  ctx.strokeStyle = '#0a0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -SHIP.size);
  ctx.lineTo(SHIP.size/2, SHIP.size);
  ctx.lineTo(-SHIP.size/2, SHIP.size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // asteroids with rough shapes
  ctx.fillStyle = '#a52a2a';
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 1;
  asteroids.forEach(a=>{
    const p = polarToCart(a.angle, a.radius);
    ctx.beginPath();
    const sides = a.points ? a.points.length : 6;
    for (let i=0;i<sides;i++) {
      const pt = a.points ? a.points[i] : {angle:(i/sides)*Math.PI*2, offset:1};
      const ang = pt.angle + a.angle;
      const rad = a.size/2 * pt.offset;
      const x = p.x + Math.cos(ang)*rad;
      const y = p.y + Math.sin(ang)*rad;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
  // fuels as glowing orbs
  fuels.forEach(f=>{
    if (f.collected) return;
    const p = polarToCart(f.angle, f.radius);
    const fuelGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, f.size/2);
    fuelGrad.addColorStop(0, '#ff0');
    fuelGrad.addColorStop(1, '#aa8000');
    ctx.fillStyle = fuelGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, f.size/2, 0, Math.PI*2);
    ctx.fill();
  });
  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  const elapsed = Math.floor((Date.now()-startTime)/1000);
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Fuel: ${Math.max(0,Math.floor(SHIP.fuel))}`, 10, 40);
  ctx.fillText(`Time: ${elapsed}s / ${TIME_LIMIT}s`, 10, 60);
}

function loop(timestamp) {
  const dt = 16; // approximate ms per frame
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

let gameOver = false;
function endGame(reason) {
  gameOver = true;
  // play appropriate sound
  if (reason === 'collision') {
    playSound(100, 'sawtooth', 0.4);
  } else if (reason === 'time') {
    playSound(300, 'triangle', 0.5);
  }
  const msg = reason==='collision' ? 'Game Over: Crash!' : 'Time Up!';
  setTimeout(()=>{alert(`${msg}\nScore: ${score}`);}, 0);
}
function polarToCart(angle, radius) {
  return {x: PLANET.x + Math.cos(angle)*radius, y: PLANET.y + Math.sin(angle)*radius};
}
function dist(p1,p2) {return Math.hypot(p1.x-p2.x, p1.y-p2.y);}

// audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type = 'sine', duration = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

let thrustSoundPlaying = false;
function startThrustSound() {
  if (thrustSoundPlaying) return;
  thrustSoundPlaying = true;
  playSound(200, 'sawtooth', 0.2);
}
function stopThrustSound() { thrustSoundPlaying = false; }

// input listeners
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'ArrowUp' && SHIP.fuel > 0) startThrustSound();
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
  if (e.key === 'ArrowUp') stopThrustSound();
});

init();
