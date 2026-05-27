// Simple Asteroid Dodge game
// Canvas with id="game" assumed in HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playThrust(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playExplosion(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
  // Ship definition
  const ship = {
    x: 50,
    y: height / 2,
    w: 30,
    h: 30,
    vy: 0,
    gravity: 0.4,
    thrust: -8,
    color: '#0f0'
  };


  // Asteroid pool
  const asteroids = [];
  // Star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const asteroidSpeed = 4;

  let score = 0;

  // Input handling – click or tap anywhere
  const thrustShip = () => { ship.vy = ship.thrust; playThrust(); };
  canvas.addEventListener('mousedown', thrustShip);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrustShip(); });

  // Game loop
  function update(dt) {
    // Move background stars for parallax effect
    // Ship physics
    ship.vy += ship.gravity;
    ship.y += ship.vy;
    // Prevent ship from leaving top
    if (ship.y < 0) { ship.y = 0; ship.vy = 0; }
    // Bottom lose condition
    if (ship.y + ship.h > height) {
      gameOver();
      return false;
    }

    // Asteroid spawning
        // Move stars for parallax
    stars.forEach(s => {
      s.x -= 0.3;
      if (s.x < 0) s.x = width;
    });
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      a.angle += a.angularVel || 0;
      // Collision detection (AABB)
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        gameOver();
        return false;
      }
      // Remove off-screen asteroids and increase score
      if (a.x + a.w < 0) {
        asteroids.splice(i, 1);
        score++;
      }
    }
    return true;
  }

  function render() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#09002b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      // create gradient once per asteroid
      const grad = ctx.createRadialGradient(
        0,
        0,
        a.w * 0.2,
        0,
        0,
        a.w / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.save();
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.angle || 0);
      ctx.fillStyle = grad;
      ctx.fillRect(-a.w / 2, -a.h / 2, a.w, a.h);
      ctx.restore();
    });
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (update(dt)) {
      render();
      requestAnimationFrame(loop);
    }
  }

  function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  const yPos = Math.random() * (height - size);
  const angle = Math.random() * Math.PI * 2;
  const angularVel = (Math.random() - 0.5) * 0.02;
  asteroids.push({ x: width, y: yPos, w: size, h: size, angle, angularVel });
}
    const size = Math.random() * 30 + 20;
    const yPos = Math.random() * (height - size);
    asteroids.push({ x: width, y: yPos, w: size, h: size });
  }

  function gameOver() {
  playExplosion();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#f00';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', width/2 - 60, height/2);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, width/2 - 40, height/2 + 30);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
