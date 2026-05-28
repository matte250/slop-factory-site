// Simple Space Debris Dodge game with enhanced graphics
// Canvas with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
    const ctx = canvas.getContext('2d');
    // Audio context for sound effects
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let audioInitialized = false;
    function playTone(freq, duration) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
      osc.start(now);
      osc.stop(now + duration / 1000);
    }
    const width = canvas.width;
    const height = canvas.height;
    // Starfield background
    const stars = [];
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    // Ship configuration
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
  window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (!audioInitialized) {
    audioCtx.resume();
    audioInitialized = true;
  }
});
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid configuration
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames

  // Power‑up configuration (shield)
  const powerUps = [];
  const powerUpSpawnRate = 600; // frames
  let shieldTimer = 0; // frames remaining with shield

  let frame = 0;
  let gameOver = false;

  function spawnAsteroid() {
  const size = Math.random() * 30 + 10;
  const angle = Math.random() * Math.PI * 2;
  const rotSpeed = (Math.random() - 0.5) * 0.04; // radians per frame
  asteroids.push({
    x: Math.random() * (width - size),
    y: -size,
    w: size,
    h: size,
    speed: Math.random() * 2 + 1,
    color: '#888',
    angle,
    rotSpeed,
  });
}

function spawnPowerUp() {
    const size = 20;
    powerUps.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2,
      color: '#ff0',
    });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    // Move starfield
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Update asteroids
    asteroids.forEach(a => {
      a.y += a.speed;
      a.angle += a.rotSpeed;
    });
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y > height) asteroids.splice(i, 1);
    }

    // Update power‑ups
    powerUps.forEach(p => (p.y += p.speed));
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (p.y > height) powerUps.splice(i, 1);
else if (rectIntersect(p, ship)) {
          shieldTimer = 300; // ~5 seconds at 60fps
          powerUps.splice(i, 1);
          playTone(660, 150); // power‑up collected
        }
    }

    // Collision detection
for (const a of asteroids) {
        if (rectIntersect(a, ship)) {
          if (shieldTimer > 0) {
            // destroy asteroid and consume shield frame
            shieldTimer = Math.max(0, shieldTimer - 30);
            a.y = height + 1; // mark for removal
            playTone(440, 200); // asteroid destroyed with shield
          } else {
            gameOver = true;
            playTone(220, 400); // collision - game over
          }
        }
      }
    // Clean destroyed asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y > height) asteroids.splice(i, 1);
    }

    // Spawn new objects
    if (frame % asteroidSpawnRate === 0) spawnAsteroid();
    if (frame % powerUpSpawnRate === 0) spawnPowerUp();

    if (shieldTimer > 0) shieldTimer--;
    frame++;
  }

  function draw() {
        // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#001030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#070');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Shield visual
    if (shieldTimer > 0) {
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ship.x + ship.w / 2, ship.y + ship.h / 2, Math.max(ship.w, ship.h), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Asteroids (rotating with shading)
    for (const a of asteroids) {
      ctx.save();
      const cx = a.x + a.w / 2;
      const cy = a.y + a.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(a.angle);
      // radial gradient for depth
      const grad = ctx.createRadialGradient(0, 0, a.w * 0.2, 0, 0, a.w / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Power‑ups (glowing)
    for (const p of powerUps) {
      const grad = ctx.createRadialGradient(p.x + p.w/2, p.y + p.h/2, 0, p.x + p.w/2, p.y + p.h/2, p.w);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game loop
  requestAnimationFrame(loop);
})();
