const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
// background ambience (soft periodic tone)
setInterval(() => playBeep(150, 300), 3000);

// ship configuration
const ship = {
  w: 30,
  h: 15,
  x: canvas.width / 2 - 15,
  y: canvas.height - 20,
  speed: 5,
};

// asteroid list
let asteroids = [];
// star field for background
const starCount = 100;
const stars = [];
function initStars(){
  for(let i=0;i<starCount;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      speed: Math.random()*0.5+0.2 // slow drift
    });
  }
}
initStars();

// input handling
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  // resume audio context on first interaction
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});
window.addEventListener('keyup', (e) => (keys[e.key] = false));

function spawnAsteroid() {
  const size = Math.random() * 30 + 10; // 10‑40px
  const x = Math.random() * (canvas.width - size);
  const speed = Math.random() * 2 + 1; // 1‑3px per frame
  asteroids.push({ x, y: -size, size, speed });
  // spawn sound
  playBeep(450, 80);
}

let spawnTimer = 0;
function update(dt) {
  // ship movement
  if (keys['ArrowLeft']) ship.x -= ship.speed;
  if (keys['ArrowRight']) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

  // move asteroids
  asteroids.forEach((a) => (a.y += a.speed));
  // remove off‑screen asteroids
  asteroids = asteroids.filter((a) => a.y < canvas.height);

  // spawn new asteroids every second
  spawnTimer += dt;
  if (spawnTimer > 1000) {
    spawnAsteroid();
    spawnTimer = 0;
  }

  // collision detection
  for (const a of asteroids) {
    if (
      a.x < ship.x + ship.w &&
      a.x + a.size > ship.x &&
      a.y < ship.y + ship.h &&
      a.y + a.size > ship.y
    ) {
      // play collision sound
      playBeep(120, 300);
      alert('Game Over');
      document.location.reload();
      break;
    }
  }
}

function draw() {
  // background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // stars
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.fillRect(s.x, s.y, 1, 1);
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });

  // ship as triangle
  ctx.fillStyle = '#00aaff';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y);
  ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
  ctx.closePath();
  ctx.fill();

  // asteroids as circles with gradient
  asteroids.forEach((a) => {
    const grad = ctx.createRadialGradient(
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size * 0.2,
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size / 2
    );
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
