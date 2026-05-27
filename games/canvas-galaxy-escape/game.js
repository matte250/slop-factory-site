// Game: Canvas Galaxy Escape
// Target canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // ---------- Audio ----------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playLaser = () => playTone(800, 0.08);
  const playExplosion = () => playTone(200, 0.2);


  // ---------- Utilities ----------
  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  // Starfield background
  const stars = [];
  const maxStars = 100;
  for (let i = 0; i < maxStars; i++) {
    stars.push({ x: rand(0, W), y: rand(0, H), r: rand(0.5, 2) });
  }

  // ---------- Ship ----------
  const ship = {
    x: W * 0.1,
    y: H / 2,
    r: 12, // radius for collision
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
    health: 3,
  };

  // ---------- Input ----------
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Unlock AudioContext on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ---------- Lasers ----------
  const lasers = [];
  const laserSpeed = 6;
  const laserLife = 60; // frames

  // ---------- Asteroids ----------
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frames = 0;

  // ---------- Game State ----------
  let distance = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = rand(15, 40);
    asteroids.push({
      x: W + size,
      y: rand(0, H),
      r: size,
      vx: -rand(1, 3),
    });
  }

  function update() {
    if (gameOver) return;
    frames++;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Fire laser
    if (keys['Space'] && frames % 10 === 0) {
      lasers.push({
        x: ship.x + Math.cos(ship.angle) * ship.r,
        y: ship.y + Math.sin(ship.angle) * ship.r,
        dx: Math.cos(ship.angle) * laserSpeed,
        dy: Math.sin(ship.angle) * laserSpeed,
        ttl: laserLife,
      });
      playLaser();
    }
    // Update ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap vertically
    if (ship.y < 0) ship.y = H;
    if (ship.y > H) ship.y = 0;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Update stars for parallax background
    for (let s of stars) {
      s.x -= 0.3; // slow leftward drift
      if (s.x < 0) {
        s.x = W;
        s.y = rand(0, H);
      }
    }
    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.dx;
      l.y += l.dy;
      l.ttl--;
      if (l.ttl <= 0 || l.x > W || l.x < 0) lasers.splice(i, 1);
    }
    // Spawn asteroids
    if (frames % asteroidSpawnRate === 0) spawnAsteroid();
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    // Collision detection ship <-> asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (dist(ship.x, ship.y, a.x, a.y) < ship.r + a.r) {
        ship.health--;
        playExplosion();
        asteroids.splice(i, 1);
        if (ship.health <= 0) {
          gameOver = true;
        }
      }
    }
    // Laser hits asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (dist(l.x, l.y, a.x, a.y) < a.r) {
          score += Math.floor(a.r);
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }
    }
    distance += Math.hypot(ship.vx, ship.vy);
  }

  function draw() {
    // Dark space background
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, W, H);
    // Starfield
    ctx.fillStyle = 'white';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(0, -ship.r, 0, ship.r);
    shipGrad.addColorStop(0, ship.health > 1 ? '#66ccff' : '#ff4444');
    shipGrad.addColorStop(1, ship.health > 1 ? '#0033aa' : '#880000');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Draw lasers with glow
    ctx.save();
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 8;
    lasers.forEach(l => {
      ctx.fillStyle = 'lime';
      ctx.fillRect(l.x - 2, l.y - 2, 4, 4);
    });
    ctx.restore();
    // Draw asteroids with simple shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#333333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${ship.health}`, 10, 40);
    ctx.fillText(`Dist: ${Math.floor(distance)}`, 10, 60);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
