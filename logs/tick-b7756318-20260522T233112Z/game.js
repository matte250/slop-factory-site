// Simple Cosmic Courier game
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 400;
  const H = canvas.height = 600;
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ship
  const ship = { w: 40, h: 20, x: W / 2 - 20, y: H - 30, speed: 4 };
  // Game state
  const asteroids = [];
  const packages = [];
  let left = false, right = false;
  let timer = 30; // seconds
  let lastTime = performance.now();
  // Ensure AudioContext resumes after user interaction
  document.addEventListener('click', () => audioCtx.resume(), { once: true });
  // Input
  document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') left = true; if (e.key === 'ArrowRight') right = true; });
  document.addEventListener('keyup', e => { if (e.key === 'ArrowLeft') left = false; if (e.key === 'ArrowRight') right = false; });
  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (W - size), y: -size, r: size / 2, speed: 2 + Math.random() * 2 });
  }
  function spawnPackage() {
    const size = 15;
    packages.push({ x: Math.random() * (W - size), y: -size, w: size, h: size, speed: 2 });
  }
  function update(dt) {
    // Ship movement
    if (left) ship.x -= ship.speed; if (right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    // Spawn
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnPackage();
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship
      if (a.y + a.r * 2 > ship.y && a.x < ship.x + ship.w && a.x + a.r * 2 > ship.x) {
        beep(200, 0.2); // collision sound
        endGame();
        return;
      }
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }
    // Update packages
    for (let i = packages.length - 1; i >= 0; i--) {
      const p = packages[i];
      p.y += p.speed;
      if (p.y + p.h > ship.y && p.x < ship.x + ship.w && p.x + p.w > ship.x) {
        beep(800, 0.1); // collect sound
        packages.splice(i, 1); // collect (no score tracking for brevity)
        continue;
      }
      if (p.y > H) packages.splice(i, 1);
    }
    // Timer
    timer -= dt / 1000;
    if (timer <= 0) endGame();
  }
  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      s.y += 0.5;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    });
    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.2, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Packages (rounded with gradient)
    packages.forEach(p => {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#c90');
      ctx.fillStyle = grad;
      const radius = 3;
      ctx.beginPath();
      ctx.moveTo(p.x + radius, p.y);
      ctx.lineTo(p.x + p.w - radius, p.y);
      ctx.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + radius);
      ctx.lineTo(p.x + p.w, p.y + p.h - radius);
      ctx.quadraticCurveTo(p.x + p.w, p.y + p.h, p.x + p.w - radius, p.y + p.h);
      ctx.lineTo(p.x + radius, p.y + p.h);
      ctx.quadraticCurveTo(p.x, p.y + p.h, p.x, p.y + p.h - radius);
      ctx.lineTo(p.x, p.y + radius);
      ctx.quadraticCurveTo(p.x, p.y, p.x + radius, p.y);
      ctx.closePath();
      ctx.fill();
    });
    // Timer display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Time: ' + Math.ceil(timer), 10, 20);
  }
  let gameOver = false;
  function endGame() {
    beep(150, 0.5); // game over sound
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', W / 2 - 80, H / 2);
  }
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
      draw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
