// Minimalistic canvas game: Cosmic Split
// Assumes an HTML canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ---- Audio ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ---- Game State ----
  let score = 0;
  let gameOver = false;

  // ---- Ship ----
  const ship = {
    x: width / 2,
    y: height - 40,
    w: 30,
    h: 30,
    split: false,
    splitTimer: 0,
    cooldown: 0,
    speed: 5,
      draw() {
        // Draw ship as triangle(s) with gradient fill
        const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
        grad.addColorStop(0, '#00ffff');
        grad.addColorStop(1, '#0066ff');
        ctx.fillStyle = grad;
        const halfW = this.w / 2;
        const drawPart = (centerX) => {
          ctx.beginPath();
          ctx.moveTo(centerX, this.y); // tip
          ctx.lineTo(centerX - halfW, this.y + this.h);
          ctx.lineTo(centerX + halfW, this.y + this.h);
          ctx.closePath();
          ctx.fill();
        };
        if (this.split) {
          drawPart(this.x - 20);
          drawPart(this.x + 20);
        } else {
          drawPart(this.x);
        }
      }
  };

  // ---- Asteroids ----
  const asteroids = [];
  let asteroidSpawn = 0;
  const asteroidBaseSpeed = 2;

  // ---- Stars ----
  const stars = [];
  let starSpawn = 0;

  // ---- Input ----
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    audioCtx.resume();
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function update(dt) {
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // Split handling
      if (keys['Space'] && ship.cooldown <= 0 && !ship.split) {
        ship.split = true;
        ship.splitTimer = 3; // seconds
        ship.cooldown = 5; // seconds
        // Play split sound
        playTone(600, 0.1);
      }
    if (ship.split) {
      ship.splitTimer -= dt;
      if (ship.splitTimer <= 0) ship.split = false;
    }
    if (ship.cooldown > 0) ship.cooldown -= dt;

    // Asteroid spawn & update
    asteroidSpawn -= dt;
    if (asteroidSpawn <= 0) {
      const size = Math.random() * 20 + 15;
      asteroids.push({ x: Math.random() * (width - size), y: -size, size, speed: asteroidBaseSpeed + score * 0.005 });
      asteroidSpawn = Math.max(0.5, 2 - score * 0.001); // faster over time
    }
    asteroids.forEach(a => a.y += a.speed);
    // Remove off-screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y > height) asteroids.splice(i, 1);
    }

    // Star spawn & update
    starSpawn -= dt;
    if (starSpawn <= 0) {
      const size = 5;
      stars.push({ x: Math.random() * (width - size), y: -size, size, speed: 2 });
      starSpawn = 3;
    }
    stars.forEach(s => s.y += s.speed);
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (s.y > height) { stars.splice(i, 1); continue; }
      // collision with ship => score
      if (collidesShip(s)) { score++; playTone(800, 0.08); stars.splice(i, 1); }
    }

    // Collision with asteroids
    for (const a of asteroids) {
      if (collidesShip(a)) { gameOver = true; playTone(200, 0.3); break; }
    }
  }

  function collidesShip(obj) {
    // simple AABB against each ship part
    const parts = ship.split ? [
      { x: ship.x - 20 - ship.w / 4, w: ship.w / 2 },
      { x: ship.x + 20 - ship.w / 4, w: ship.w / 2 }
    ] : [{ x: ship.x - ship.w / 2, w: ship.w }];
    for (const p of parts) {
      const shipRect = { x: p.x, y: ship.y, w: p.w, h: ship.h };
      const objRect = { x: obj.x, y: obj.y, w: obj.size, h: obj.size };
      if (rectIntersect(shipRect, objRect)) return true;
    }
    return false;
  }
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      // background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#001');
      bgGrad.addColorStop(1, '#000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      // stars with glow
      stars.forEach(s => {
        const grad = ctx.createRadialGradient(s.x + s.size/2, s.y + s.size/2, 0, s.x + s.size/2, s.y + s.size/2, s.size);
        grad.addColorStop(0, 'rgba(255,255,200,0.9)');
        grad.addColorStop(1, 'rgba(255,255,200,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x + s.size/2, s.y + s.size/2, s.size/2, 0, Math.PI*2);
        ctx.fill();
      });
      // asteroids with rocky texture (simple gradient)
      asteroids.forEach(a => {
        const grad = ctx.createRadialGradient(a.x + a.size/2, a.y + a.size/2, a.size*0.2, a.x + a.size/2, a.y + a.size/2, a.size/2);
        grad.addColorStop(0, '#555');
        grad.addColorStop(1, '#111');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI*2);
        ctx.fill();
      });
      // ship
      ship.draw();
      // score
      ctx.fillStyle = 'white';
      ctx.font = '16px sans-serif';
      ctx.fillText('Score: ' + score, 10, 20);
      if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2);
      }
    }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
