// Simple shooter based on IDEA.md
const canvas = document.getElementById('game');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Player
const player = { w: 40, h: 20, x: canvas.width / 2 - 20, y: canvas.height - 30, speed: 5 };
let movingLeft = false, movingRight = false;

// Bullets
const bullets = [];
const bulletSpeed = 7;

// Asteroids
const asteroids = [];
let asteroidTimer = 0;
const asteroidInterval = 90; // frames
const asteroidSpeed = 2;

// Starfield
const stars = [];
function initStars(count = 100) {
  stars.length = 0;
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
  }
}
initStars();

// Explosion particles
const particles = [];
function createExplosion(x, y, radius) {
  const count = Math.floor(radius / 2);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    particles.push({
      x: x + radius / 2,
      y: y + radius / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.random() * 0.5 + 0.5
    });
  }
}

let gameOver = false;
let score = 0;

function spawnAsteroid() {
  const size = 20 + Math.random() * 30;
  const x = Math.random() * (canvas.width - size);
  asteroids.push({ x, y: -size, w: size, h: size });
}

function update() {
  if (gameOver) return;

  // Move player
  if (movingLeft) player.x = Math.max(0, player.x - player.speed);
  if (movingRight) player.x = Math.min(canvas.width - player.w, player.x + player.speed);

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= bulletSpeed;
    if (b.y < 0) bullets.splice(i, 1);
  }

  // Spawn asteroids
  if (asteroidTimer <= 0) {
    spawnAsteroid();
    asteroidTimer = asteroidInterval;
  } else asteroidTimer--;

  // Update stars (simple twinkling/movement)
  stars.forEach(s => {
    s.y += 0.3; // slow fall
    if (s.y > canvas.height) s.y = 0;
  });

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += asteroidSpeed;
    // collision with player
    if (a.x < player.x + player.w && a.x + a.w > player.x && a.y < player.y + player.h && a.y + a.h > player.y) {
      gameOver = true;
    }
    // collision with bullets
    let hit = false;
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
        bullets.splice(j, 1);
        asteroids.splice(i, 1);
        score++;
        hit = true;
        // create explosion at asteroid location
        createExplosion(a.x, a.y, a.w);
        // explosion sound
        playTone(400, 0.2);
        break;
      }
    }
    if (hit) continue;
    // asteroid reaches bottom
    if (a.y > canvas.height) {
      gameOver = true;
      playTone(200, 0.5);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw background stars
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#555';
  stars.forEach(s => ctx.fillRect(s.x, s.y, 1, 1));

  // player - draw as triangle ship
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  // bullets - draw as circles
  ctx.fillStyle = '#ff0';
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // asteroids - draw as circles
  ctx.fillStyle = '#f00';
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // explosions (optional) - draw fading particles
  particles.forEach(p => {
    ctx.fillStyle = `rgba(255,165,0,${p.life})`;
    ctx.fillRect(p.x, p.y, 2, 2);
  });

  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// Input handling
// Ensure audio can start after user interaction
function resumeAudio(){if(audioCtx.state==='suspended')audioCtx.resume();}

document.addEventListener('keydown', e => {
  resumeAudio();
  if (e.code === 'ArrowLeft') movingLeft = true;
  if (e.code === 'ArrowRight') movingRight = true;
    if (e.code === 'Space') {
      // fire bullet
      bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10 });
      playTone(800, 0.1);
    }
});

document.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') movingLeft = false;
  if (e.code === 'ArrowRight') movingRight = false;
});

requestAnimationFrame(loop);
