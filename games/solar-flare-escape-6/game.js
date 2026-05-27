// Simple top‑down game with enhanced graphics
// Canvas with id "game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;
  // ---------- Audio setup ----------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  // ---------- Background stars ----------
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
  }

  // ---------- Player ----------
  // create background stars for visual depth
  const ship = {
    x: W / 2,
    y: H / 2,
    size: 20,
    speed: 2,
    shield: 100,
    vx: 0,
    vy: 0,
    color: '#00f',
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // thrust sound when moving
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) playTone(220, 0.05);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---------- Game objects ----------
  const asteroids = [];
  const cells = [];
  let flare = null; // {x,y,w,h,dx}
  let flareTimer = 0;
  let gameOver = false;

  // ---------- Helpers ----------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

  function spawnAsteroid() {
    const r = rand(10, 30);
    const side = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    switch (side) {
      case 0: x = rand(0, W); y = -r; vx = rand(-1, 1); vy = rand(0.5, 2); break;
      case 1: x = W + r; y = rand(0, H); vx = -rand(0.5, 2); vy = rand(-1, 1); break;
      case 2: x = rand(0, W); y = H + r; vx = rand(-1, 1); vy = -rand(0.5, 2); break;
      case 3: x = -r; y = rand(0, H); vx = rand(0.5, 2); vy = rand(-1, 1); break;
    }
    asteroids.push({ x, y, r, vx, vy });
  }

  function spawnCell() {
    cells.push({ x: rand(20, W - 20), y: rand(20, H - 20), size: 10 });
  }

  function startFlare() {
    const h = 30; // flare height
    flare = { x: 0, y: -h, w: W, h, dx: 6 };
  }

  function update() {
    // move background stars to simulate travel
    stars.forEach(s => {
      s.y += 0.4;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
      // twinkle effect
      s.r = Math.max(0.5, Math.min(2, s.r + (Math.random() - 0.5) * 0.1));
    });
    // move background stars to simulate travel
    stars.forEach(s => {
      s.y += 0.4;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    });
    if (gameOver) return;
    // --- Player movement ---
    ship.vx = ship.vy = 0;
    if (keys.ArrowUp) ship.vy = -ship.speed;
    if (keys.ArrowDown) ship.vy = ship.speed;
    if (keys.ArrowLeft) ship.vx = -ship.speed;
    if (keys.ArrowRight) ship.vx = ship.speed;
    ship.x = Math.max(0, Math.min(W, ship.x + ship.vx));
    ship.y = Math.max(0, Math.min(H, ship.y + ship.vy));

    // --- Asteroids ---
    if (Math.random() < 0.02) spawnAsteroid();
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
    });
    // remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.r || a.x > W + a.r || a.y < -a.r || a.y > H + a.r) asteroids.splice(i, 1);
    }

    // --- Energy cells ---
    if (Math.random() < 0.005) spawnCell();
    // collect cells
    for (let i = cells.length - 1; i >= 0; i--) {
      const c = cells[i];
if (dist2(ship, c) < (ship.size / 2 + c.size) ** 2) {
          ship.shield = Math.min(100, ship.shield + 20);
          playTone(400, 0.05); // cell collected
          cells.splice(i, 1);
        }
    }

    // --- Solar flare ---
    flareTimer--;
    if (flareTimer <= 0) {
      if (!flare) startFlare();
      flareTimer = 300; // frames until next flare
    }
    if (flare) {
      flare.y += flare.dx;
      if (flare.y > H) flare = null;
    }

    // --- Collisions ---
    // ship vs asteroids
    for (const a of asteroids) {
if (dist2(ship, a) < (ship.size / 2 + a.r) ** 2) {
          ship.shield -= 30;
          playTone(150, 0.2); // asteroid hit
          // remove asteroid on hit
          asteroids.splice(asteroids.indexOf(a), 1);
          break;
        }
    }
    // ship vs flare
if (flare && ship.y > flare.y && ship.y < flare.y + flare.h) {
        ship.shield -= 20;
        playTone(100, 0.3); // flare hit
      }
    if (ship.shield <= 0) gameOver = true;
  }

  function draw() {
    // draw background stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // clear with space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ship with gradient glow
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.size / 2, ship.x, ship.y + ship.size / 2);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#33f');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size / 2);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    // outline for contrast
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // asteroids with subtle shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // cells
    ctx.fillStyle = '#0f0';
    cells.forEach(c => {
      ctx.fillRect(c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
    });

    // flare with gradient pulse
    if (flare) {
      const flareGrad = ctx.createLinearGradient(0, flare.y, 0, flare.y + flare.h);
      flareGrad.addColorStop(0, 'rgba(255,200,0,0.2)');
      flareGrad.addColorStop(0.5, 'rgba(255,140,0,0.5)');
      flareGrad.addColorStop(1, 'rgba(255,80,0,0.2)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(flare.x, flare.y, flare.w, flare.h);
    }

    // shield bar
    ctx.fillStyle = '#0ff';
    ctx.fillRect(10, 10, ship.shield * 2, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, 200, 10);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
