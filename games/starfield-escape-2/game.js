// Simple Starfield Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);

  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const playExplosion = () => playTone(120, 0.2);
  const playPowerUp = () => playTone(600, 0.1);
  const playShieldHit = () => playTone(300, 0.15);

  // Game objects
  const ship = {
    x: width / 2,
    y: height - 60,
    width: 30,
    height: 40,
    speed: 4,
    color: '#0f0',
    shield: false,
  };

  const stars = [];
  const asteroids = [];
  const powerUps = [];

  let keys = {};
  let gameOver = false;
  let score = 0;

  // Helpers
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createStar() {
    stars.push({ x: rand(0, width), y: rand(0, height), size: rand(0.5, 2), speed: rand(0.2, 1) });
  }
  for (let i = 0; i < 100; i++) createStar();

  function spawnAsteroid() {
    const size = rand(20, 50);
    asteroids.push({ x: rand(0, width - size), y: -size, size, speed: rand(2, 5) });
  }

  function spawnPowerUp() {
    const size = 20;
    powerUps.push({ x: rand(0, width - size), y: -size, size, speed: 2, type: Math.random() < 0.5 ? 'speed' : 'shield' });
  }

  // Input
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
    if (keys.ArrowRight && ship.x + ship.width < width) ship.x += ship.speed;
    if (keys.ArrowUp && ship.y > 0) ship.y -= ship.speed;
    if (keys.ArrowDown && ship.y + ship.height < height) ship.y += ship.speed;

    // Update stars
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = rand(0, width); }
    });

    // Spawn asteroids & power‑ups
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnPowerUp();

    // Move asteroids
    asteroids.forEach(a => a.y += a.speed);
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) if (asteroids[i].y > height) asteroids.splice(i, 1);

    // Move power‑ups
    powerUps.forEach(p => p.y += p.speed);
    for (let i = powerUps.length - 1; i >= 0; i--) if (powerUps[i].y > height) powerUps.splice(i, 1);

    // Collision detection
    function rectOverlap(r1, r2) {
      return !(r2.x > r1.x + r1.width ||
               r2.x + r2.size < r1.x ||
               r2.y > r1.y + r1.height ||
               r2.y + r2.size < r1.y);
    }

    // Asteroid collision
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (rectOverlap(ship, a)) {
        if (ship.shield) {
          ship.shield = false; // shield consumes one hit
          playShieldHit();
          asteroids.splice(i, 1);
        } else {
          playExplosion();
          gameOver = true;
        }
      }
    }

    // Power‑up collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
if (rectOverlap(ship, p)) {
          playPowerUp();
          if (p.type === 'speed') ship.speed = 7;
          if (p.type === 'shield') ship.shield = true;
          powerUps.splice(i, 1);
          setTimeout(() => { ship.speed = 4; }, 5000); // speed boost lasts 5s
        }
    }

    score++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars - twinkling circles
    stars.forEach(s => {
      const alpha = Math.min(1, s.size / 2 + 0.3);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship - triangle with glow when shielded
    ctx.save();
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.rotate(-Math.PI / 2);
    const shipGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ship.width);
    shipGrad.addColorStop(0, ship.shield ? '#0ff' : '#0f0');
    shipGrad.addColorStop(1, '#030');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(-ship.width / 2, ship.height / 2);
    ctx.lineTo(ship.width / 2, ship.height / 2);
    ctx.lineTo(0, -ship.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids - shaded circles
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.size / 2, a.y + a.size / 2, a.size * 0.2, a.x + a.size / 2, a.y + a.size / 2, a.size);
      grad.addColorStop(0, '#8b0000');
      grad.addColorStop(1, '#330000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Power‑ups - colored circles with inner glow
    powerUps.forEach(p => {
      const outer = p.type === 'shield' ? '#0ff' : '#ff0';
      const inner = p.type === 'shield' ? '#00a' : '#aa0';
      const grad = ctx.createRadialGradient(p.x + p.size / 2, p.y + p.size / 2, p.size * 0.2, p.x + p.size / 2, p.y + p.size / 2, p.size / 2);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + p.size / 2, p.y + p.size / 2, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
