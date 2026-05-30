// Minimal Meteor Dodge game
// Canvas with id="game"

const canvas = document.getElementById('game');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Ensure audio context is resumed on first user interaction
window.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });
function playSound(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Player ship
const ship = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  w: 40,
  h: 20,
  speed: 5,
  dx: 0,
  dy: 0,
};

// Meteor pool
let meteors = [];
let particles = [];
const meteorSpawnRate = 1000; // ms
const meteorSpeed = 2;

let score = 0;
let lives = 3;
let lastSpawn = 0;
let lastTime = 0;

// Input handling
const keys = {};
window.addEventListener('keydown', e => {keys[e.key] = true;});
window.addEventListener('keyup', e => {keys[e.key] = false;});

function updateShip() {
  ship.dx = 0; ship.dy = 0;
  if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
  if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
  if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
  if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x + ship.dx));
  ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y + ship.dy));
}

function spawnMeteor() {
  // play spawn sound
  playSound(150, 0.07);
  const size = Math.random() * 30 + 20;
  const side = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  // 0:left,1:top,2:right,3:bottom
  if (side === 0) { x = -size; y = Math.random()*canvas.height; vx = meteorSpeed; vy = 0; }
  else if (side === 1) { x = Math.random()*canvas.width; y = -size; vx = 0; vy = meteorSpeed; }
  else if (side === 2) { x = canvas.width + size; y = Math.random()*canvas.height; vx = -meteorSpeed; vy = 0; }
  else { x = Math.random()*canvas.width; y = canvas.height + size; vx = 0; vy = -meteorSpeed; }
  meteors.push({x, y, w:size, h:size, vx, vy});
}

function updateMeteors(dt) {
  meteors.forEach(m => { m.x += m.vx * dt; m.y += m.vy * dt; });
  // Remove off‑screen meteors and increase score
  meteors = meteors.filter(m => {
    const onScreen = m.x + m.w > -50 && m.x < canvas.width + 50 && m.y + m.h > -50 && m.y < canvas.height + 50;
    if (!onScreen) score++;
    return onScreen;
  });
}

function rectIntersect(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkCollisions(){
  for (let i=0;i<meteors.length;i++){
    if (rectIntersect(ship, meteors[i])){ // collision detected
      // play collision sound
      playSound(300, 0.2);
      // generate explosion particles
      const m = meteors[i];
      for (let p = 0; p < 12; p++) {
        particles.push({
          x: ship.x + ship.w / 2,
          y: ship.y + ship.h / 2,
          size: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 30,
          maxLife: 30,
        });
      }
      lives--;
      meteors.splice(i,1);
      if(lives===0){
        alert('Game Over! Score: '+score);
        // reset
        lives=3; score=0; meteors=[]; ship.x=canvas.width/2; ship.y=canvas.height-50;
      }
      break;
    }
  }
}

function draw() {
  // Draw background star field
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // small stars
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = 'white';
    const sx = Math.random() * canvas.width;
    const sy = Math.random() * canvas.height;
    ctx.fillRect(sx, sy, 1, 1);
  }

  // ship as triangle with glow
  ctx.fillStyle = 'cyan';
  ctx.shadowColor = 'cyan';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // meteors as circles with radial gradient
  meteors.forEach(m => {
    const grad = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, m.w * 0.1, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
    grad.addColorStop(0, 'lightgray');
    grad.addColorStop(1, 'gray');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // particles (explosions)
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    ctx.fillStyle = `rgba(255,165,0,${p.life / p.maxLife})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
  ctx.fillText('Lives: ' + lives, 10, 40);
}


function loop(timestamp){
  const dt = (timestamp - lastTime)/1000; // seconds
  lastTime = timestamp;
  if (timestamp - lastSpawn > meteorSpawnRate) { spawnMeteor(); lastSpawn = timestamp; }
  updateShip();
  updateMeteors(dt);
  checkCollisions();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
