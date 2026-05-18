// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Player ship (drawn as a triangle)
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Input handling
  const keys = {};
  // Unlock audio on first user interaction
  function unlockAudio(){ if (audioCtx.state !== 'running') audioCtx.resume(); }
  window.addEventListener('keydown', e => { keys[e.key] = true; unlockAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Stars for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5
    });
  }

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.1; // rotation per frame
    asteroids.push({ x, y: -radius, radius, speed, angle, rotSpeed });
  }

  // Game state
  let score = 0;
  let gameOver = false;

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    else if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x + ship.dx));

    // Spawn asteroids
    if (Date.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Check collision with ship (simple AABB vs circle)
        if (
          a.y + a.radius > ship.y &&
          a.x > ship.x && a.x < ship.x + ship.width
        ) {
          gameOver = true;
          playBeep(200, 0.3); // collision sound
        }
      // Remove off-screen
        if (a.y - a.radius > height) {
          asteroids.splice(i, 1);
          score++;
          playBeep(800, 0.05); // dodge sound
        }
    }
  }

  function draw() {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship
    ship.draw();

    // Asteroids with rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = '#a55';
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
