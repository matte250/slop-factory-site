// Simple Space Debris Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let bgStarted = false;
  function startBackground() {
    if (bgStarted) return;
    bgStarted = true;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(30, audioCtx.currentTime); // low hum
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
  }
  function playCollision() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  // Player ship
  const ship = { x: width / 2, y: height - 50, w: 30, h: 30, speed: 4, health: 3 };
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

  // Debris array
  const debris = [];
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  let spawnTimer = 0;
  let elapsed = 0;
  let lastTime = performance.now();

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    startBackground(); // start ambient hum on first interaction
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn debris
    spawnTimer += dt;
    const spawnInterval = Math.max(500 - elapsed * 10, 100); // faster over time
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      const size = 20 + Math.random() * 20;
      const side = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      const speed = 1 + elapsed * 0.05;
      switch (side) {
        case 0: // top
          x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * speed; vy = speed; break;
        case 1: // bottom
          x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
        case 2: // left
          x = -size; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
        case 3: // right
          x = width + size; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
      }
      debris.push({ x, y, w: size, h: size, vx, vy });
    }

    // Update debris positions and check collisions
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x += d.vx; d.y += d.vy;
      // Remove if off-screen
      if (d.x < -d.w || d.x > width + d.w || d.y < -d.h || d.y > height + d.h) {
        debris.splice(i, 1);
        continue;
      }
      // Simple AABB collision
      if (d.x < ship.x + ship.w && d.x + d.w > ship.x && d.y < ship.y + ship.h && d.y + d.h > ship.y) {
        playCollision();
        ship.health--;
        debris.splice(i, 1);
        if (ship.health <= 0) {
          // Game over
          alert('Game Over! Score: ' + Math.floor(elapsed / 1000) + 's');
          document.location.reload();
          return;
        }
      }
    }

    elapsed += dt;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship as a triangle with outline
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw debris as circles with slight gradient
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(d.x + d.w / 2, d.y + d.h / 2, 0, d.x + d.w / 2, d.y + d.h / 2, d.w / 2);
      grad.addColorStop(0, '#f80');
      grad.addColorStop(1, '#a50');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + ship.health, 10, 20);
    ctx.fillText('Score: ' + Math.floor(elapsed / 1000) + 's', 10, 40);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
