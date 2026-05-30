// Simple Asteroid Rush game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0f0',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Bullets
  const bullets = [];

  // Asteroids
  const asteroids = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
let asteroidSpeed = 1.5;
  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  // Particle explosion pool
  const particles = []; // each {x,y,dx,dy,life, maxLife}

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function ensureAudio() {
    if (audioInitialized) return;
    // Resume audio context on first user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audioInitialized = true;
  }
  function playTone(freq, duration) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playShoot() {
    playTone(600, 0.1);
  }
  function playExplosion() {
    // quick burst of noise using white noise buffer
    ensureAudio();
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
  }


  function update(delta) {
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Shooting
    if (keys[' ']) {
      // Simple rate limit
if (!ship.lastShot || Date.now() - ship.lastShot > 300) {
          bullets.push({ x: ship.x + ship.w / 2, y: ship.y, w: 2, h: 10, speed: 7 });
          ship.lastShot = Date.now();
          playShoot();
        }
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Spawn asteroids over time
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
      // accelerate spawning
      spawnInterval = Math.max(300, spawnInterval * 0.95);
      asteroidSpeed += 0.05;
    }

    // Update stars (slow drift)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.2; // slow downward drift
      if (s.y > height) {
        s.y = -s.r;
        s.x = Math.random() * width;
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Check bottom (lose condition)
      if (a.y + a.h >= height) {
        gameOver = true;
      }
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // Ship collision
      if (rectIntersect(a, ship)) {
        gameOver = true;
        break;
      }
      // Bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (rectIntersect(a, b)) {
          // remove both
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          // create explosion particles
          for (let k = 0; k < 8; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            particles.push({
              x: a.x + a.w / 2,
              y: a.y + a.h / 2,
              dx: Math.cos(angle) * speed,
              dy: Math.sin(angle) * speed,
              life: 0,
              maxLife: 30,
            });
          }
          playExplosion();
          break;
        }
      }
    }
  }

  function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  // Dark space background
  ctx.fillStyle = '#001';
  ctx.fillRect(0, 0, width, height);
  // Stars
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Particles (explosions)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life++;
    const alpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = `rgba(255,165,0,${alpha})`;
    ctx.fillRect(p.x, p.y, 2, 2);
    if (p.life >= p.maxLife) particles.splice(i, 1);
  }
  // Ship (triangle) with gradient
  const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
  shipGrad.addColorStop(0, '#0f0');
  shipGrad.addColorStop(1, '#080');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  // Bullets
  ctx.fillStyle = '#ff0';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
  // Asteroids with radial gradient
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w / 4, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.fillRect(a.x, a.y, a.w, a.h);
  });
  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f00';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }
}

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
