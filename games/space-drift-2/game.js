// Simple endless‑scroll space game
// Canvas with id="game" expected in the host HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // ----- Sound setup -----
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
  function thrustSound() { playTone(440, 0.05); }
  function collectSound() { playTone(800, 0.1); }
  function explosionSound() { playTone(200, 0.5); }


  // ----- Ship -----
  const ship = {
    x: W / 2,
    y: H / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    fuel: 100,
    thrust: 0.05,
    rotateSpeed: 0.07,
  };

  // ----- Game state -----
  let obstacles = [];
  let orbs = [];
  let score = 0;
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms

  // ----- Input -----
  const keys = {};
  let audioStarted = false;
  function ensureAudio(){
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
  }
  window.addEventListener('keydown', e => {
    ensureAudio();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawn() {
    // asteroid / mine
    const size = 15 + Math.random() * 20;
    obstacles.push({
      x: W + size,
      y: Math.random() * H,
      vx: -1 - Math.random() * 1.5,
      radius: size,
    });
    // energy orb
    if (Math.random() < 0.5) {
      const r = 8;
      orbs.push({
        x: W + r,
        y: Math.random() * H,
        vx: -1 - Math.random() * 0.5,
        radius: r,
      });
    }
  }

  function update(dt) {
    // controls
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    if (keys.ArrowUp && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel = Math.max(0, ship.fuel - 0.02);
      thrustSound();
    }
    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;
    // friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // spawn obstacles/orbs
    const now = performance.now();
    if (now - lastSpawn > spawnInterval) {
      spawn();
      lastSpawn = now;
    }

    // update and cull obstacles
    obstacles = obstacles.filter(o => {
      o.x += o.vx;
      return o.x + o.radius > 0;
    });
    // update and cull orbs
    orbs = orbs.filter(o => {
      o.x += o.vx;
      return o.x + o.radius > 0;
    });

    // collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
      if (Math.hypot(dx, dy) < ship.radius + o.radius) {
        // lose condition
        explosionSound();
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
if (Math.hypot(dx, dy) < ship.radius + o.radius) {
          score += 10;
          ship.fuel = Math.min(100, ship.fuel + 10);
          collectSound();
          orbs.splice(i, 1);
        }
    }
    // fuel loss over time
    ship.fuel = Math.max(0, ship.fuel - 0.005 * dt);
    if (ship.fuel <= 0) {
      alert('Out of fuel! Score: ' + Math.floor(score));
      document.location.reload();
    }
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // starfield (simple random stars each frame)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // ship with glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // obstacles – rendered as rough rocks
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(Math.random() * Math.PI * 2);
      ctx.fillStyle = '#844';
      ctx.beginPath();
      ctx.moveTo(o.radius, 0);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const r = o.radius * (0.7 + Math.random() * 0.3);
        ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // orbs – glowing energy orbs
    orbs.forEach(o => {
      const gradOrb = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      gradOrb.addColorStop(0, 'rgba(255,255,0,0.8)');
      gradOrb.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = gradOrb;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 40);
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
