// Simple Asteroid Dodge game targeting canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = { x: 50, y: height / 2, w: 30, h: 20, dy: 0 };

  // Input handling (arrow keys & mouse)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
  });

  // Asteroids
  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms
  let score = 0;
  let gameOver = false;
  // Simple sound engine using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width + size, y: Math.random() * (height - size), r: size, speed: 2 + Math.random() * 3 });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship movement via arrow keys
    if (keys['ArrowUp']) ship.dy = -4;
    else if (keys['ArrowDown']) ship.dy = 4;
    else ship.dy = 0;
    ship.y += ship.dy;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Remove off‑screen
      if (a.x + a.r < 0) {
        asteroids.splice(i, 1);
        score++;
        playBeep(400, 80); // point sound
        continue;
      }
      // Collision check (simple AABB vs circle)
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      const dx = a.x - closestX;
      const dy = a.y - closestY;
      if (dx * dx + dy * dy < a.r * a.r) {
        playBeep(150, 300); // collision sound
        gameOver = true;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Ship (draw as triangle with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#8f8');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // Asteroids (draw with radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', width / 2 - 100, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
