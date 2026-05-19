// Simple Neon Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Ensure audio context resumes on first user interaction
function resumeAudio(){if(audioCtx.state==='suspended') audioCtx.resume();}
window.addEventListener('click', resumeAudio);
window.addEventListener('keydown', resumeAudio);

function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain).connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration/1000);
  osc.start(now);
  osc.stop(now + duration/1000);
}
function playLaser(){playTone(600,100);}
function playExplosion(){playTone(200,200);}
function playGameOver(){
  for(let i=0;i<3;i++){
    setTimeout(()=>playTone(100,150), i*200);
  }
}

// Ship definition
const ship = {
  width: 40,
  height: 20,
  x: WIDTH / 2 - 20,
  y: HEIGHT - 30,
  speed: 5,
  color: '#0ff',
};

let leftPressed = false;
let rightPressed = false;
let spacePressed = false;

// Asteroid definition
class Asteroid {
  constructor() {
    this.radius = 15 + Math.random() * 10;
    this.x = Math.random() * (WIDTH - this.radius * 2) + this.radius;
    this.y = -this.radius;
    this.speed = 2 + Math.random() * gameSpeed;
    this.color = '#f0f'; // neon magenta
    this.glowColor = '#ff00ff'; // neon glow
  }

  update() {
    this.y += this.speed;
  }
  draw() {
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}


// Laser definition
class Laser {
  constructor(x) {
    this.x = x;
    this.y = ship.y;
    this.width = 4;
    this.height = 10;
    this.speed = 7;
    this.color = '#ff0';
  }
  update() {
    this.y -= this.speed;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
  }
}

let asteroids = [];
let lasers = [];
let spawnTimer = 0;
let spawnInterval = 90; // frames
let gameSpeed = 0; // increases over time
let score = 0;
let gameOver = false;
// Starfield settings
const STAR_COUNT = 100;
let stars = [];

function reset() {
  asteroids = [];
  lasers = [];
  spawnTimer = 0;
  gameSpeed = 0;
  score = 0;
  gameOver = false;
  ship.x = WIDTH / 2 - ship.width / 2;
  // Initialize starfield
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
}

function rectCircleCollide(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.width / 2);
  const distY = Math.abs(circle.y - rect.y - rect.height / 2);
  if (distX > rect.width / 2 + circle.radius) return false;
  if (distY > rect.height / 2 + circle.radius) return false;
  if (distX <= rect.width / 2) return true;
  if (distY <= rect.height / 2) return true;
  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function rectRectCollide(r1, r2) {
  return !(r2.x > r1.x + r1.width ||
           r2.x + r2.width < r1.x ||
           r2.y > r1.y + r1.height ||
           r2.y + r2.height < r1.y);
}

function update() {
  if (gameOver) return;

  // Move ship
  if (leftPressed && ship.x > 0) ship.x -= ship.speed;
  if (rightPressed && ship.x + ship.width < WIDTH) ship.x += ship.speed;

  // Fire laser
  if (spacePressed) {
    lasers.push(new Laser(ship.x + ship.width / 2));
    playLaser();
    spacePressed = false; // single shot per press
  }

  // Update starfield
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > HEIGHT) {
      s.y = 0;
      s.x = Math.random() * WIDTH;
    }
  });

  // Update asteroids
  asteroids.forEach(a => a.update());
  asteroids = asteroids.filter(a => a.y - a.radius < HEIGHT);

  // Update lasers
  lasers.forEach(l => l.update());
  lasers = lasers.filter(l => l.y + l.height > 0);

  // Collision detection
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const ast = asteroids[i];
    // Ship collision (lose condition)
    if (rectCircleCollide(ast, ship)) {
      gameOver = true;
      break;
    }
    // Laser hits asteroid
    for (let j = lasers.length - 1; j >= 0; j--) {
      const las = lasers[j];
      const laserRect = {x: las.x - las.width/2, y: las.y, width: las.width, height: las.height};
      if (rectCircleCollide(ast, laserRect)) {
        asteroids.splice(i, 1);
        lasers.splice(j, 1);
        score++;
        break;
      }
    }
  }

  // Spawn new asteroids
  spawnTimer++;
  if (spawnTimer > spawnInterval) {
    asteroids.push(new Asteroid());
    spawnTimer = 0;
    // increase speed gradually
    gameSpeed += 0.02;
  }
}

function draw() {
  // Clear with neon gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#040');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw starfield (tiny glowing points)
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 4;
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // Ship with neon glow
  ctx.fillStyle = ship.color;
  ctx.shadowColor = ship.color;
  ctx.shadowBlur = 12;
  ctx.fillRect(ship.x, ship.y, ship.width, ship.height);
  ctx.shadowBlur = 0;

  // Asteroids
  asteroids.forEach(a => a.draw());

  // Lasers with neon gradient trail
  lasers.forEach(l => {
    const grad = ctx.createLinearGradient(0, l.y, 0, l.y + l.height);
    grad.addColorStop(0, '#ff0');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(l.x - l.width / 2, l.y, l.width, l.height);
  });

  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#f00';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    ctx.font = '16px monospace';
    ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 30);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input handling
document.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') leftPressed = true;
  if (e.code === 'ArrowRight') rightPressed = true;
  if (e.code === 'Space') spacePressed = true;
  if (e.code === 'KeyR' && gameOver) reset();
});

document.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') leftPressed = false;
  if (e.code === 'ArrowRight') rightPressed = false;
});

reset();
loop();
