// Simple "Nebula Chase" game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function playShoot() { playTone(440, 0.1); }
  function playExplosion() { playTone(80, 0.3); }
  function playGameOver() { playTone(200, 0.5); }

  // Game settings
  const shipWidth = 40;
  const shipHeight = 20;
  const shipSpeed = 5;
  const bulletSpeed = 7;
  const asteroidSpeed = 2;
  const asteroidSpawnInterval = 1500; // ms
  const maxLives = 3;

  let ship = { x: width / 2 - shipWidth / 2, y: height - shipHeight - 10, w: shipWidth, h: shipHeight };
  let bullets = [];
  let asteroids = []; // array of asteroids
let particles = []; // explosion particles
  let keys = {};
  let score = 0;
  let lives = maxLives;
  let lastAsteroid = 0;
  let gameOver = false;
  let gameOverPlayed = false;
  // star field
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // Input handling
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, w: size, h: size });
  }

  function update(dt) {
    // Ship movement
    if (keys['ArrowLeft'] || keys['KeyA']) ship.x -= shipSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.x += shipSpeed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Fire bullet
    if (keys['Space'] && !keys['_spacePressed']) {
      bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10 });
      playShoot();
      keys['_spacePressed'] = true;
    }
    if (!keys['Space']) keys['_spacePressed'] = false;

    // Move bullets
    bullets.forEach(b => b.y -= bulletSpeed);
    bullets = bullets.filter(b => b.y + b.h > 0);

    // Move asteroids
    asteroids.forEach(a => a.y += asteroidSpeed);

    // Collision: bullet-asteroid
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
          // create explosion particles
          for (let p = 0; p < 8; p++) {
            particles.push({
              x: a.x + a.w / 2,
              y: a.y + a.h / 2,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 30,
              size: Math.random() * 2 + 1,
            });
          }
          bullets.splice(i, 1);
          asteroids.splice(j, 1);
          score += 10;
          playExplosion();
          break;
        }
      }
    }

    // Collision: asteroid-ship or bottom
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // ship hit
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        asteroids.splice(i, 1);
        lives--;
        if (lives <= 0) { gameOver = true; if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; } }
        continue;
      }
      // bottom reached
      if (a.y + a.h >= height) {
        asteroids.splice(i, 1);
          if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
          gameOver = true;
      }
    }

    // spawn asteroids over time
    if (Date.now() - lastAsteroid > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroid = Date.now();
    }
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars background
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Bullets (circles)
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Asteroids (circles)
    ctx.fillStyle = '#f44';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Explosion particles
    particles.forEach(p => {
      ctx.fillStyle = 'rgba(255,165,0,' + (p.life/30) + ')'; // orange fade
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    // Remove dead particles
    particles = particles.filter(p => p.life > 0);
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, width - 80, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 10);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    if (!gameOver) update(dt);
    draw();
    lastTime = timestamp;
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
