// Simple side‑scrolling runner based on IDEA.md
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 400);

  // Audio context and simple tone player
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Player ship (triangular)
  const ship = { w: 40, h: 20, x: 80, y: H / 2 - 10, vy: 0 };
  const SPEED = 2;
  const GRAVITY = 0.1;
  // Generate twinkling stars
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 1,
      alpha: Math.random(),
      twinkle: Math.random() * 0.02 + 0.01,
    });
  }
  // Particle trail for ship
  const particles = [];
  const maxParticles = 50;
  // Background ambience interval
  setInterval(() => {
    if (running) playTone(150, 0.2);
  }, 3000);

  // Game state
  let obstacles = [];
  let fuels = [];
  let frame = 0;
  let fuel = 100;
  let score = 0;
  let running = true;

  // Input handling (arrow keys or mouse)
  const keys = { up: false, down: false };
  window.addEventListener('keydown', e => {
    // Ensure audio context is resumed on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp') {
      keys.up = true;
      playTone(300, 0.05); // thrust sound
    }
    if (e.key === 'ArrowDown') {
      keys.down = true;
      playTone(300, 0.05);
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top - ship.h / 2;
  });

  // Helper: spawn obstacles / fuel cells
  function spawn() {
    if (frame % 90 === 0) {
      // asteroid (circle) with rotation
      const size = 30 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      const angularSpeed = (Math.random() - 0.5) * 0.02;
      obstacles.push({ w: size, h: size, x: W, y: Math.random() * (H - size), type: 'asteroid', angle, angularSpeed });
    }
    if (frame % 150 === 0) {
      // drone (square) with slight rotation
      const size = 25;
      const angle = Math.random() * Math.PI * 2;
      const angularSpeed = (Math.random() - 0.5) * 0.015;
      obstacles.push({ w: size, h: size, x: W, y: Math.random() * (H - size), type: 'drone', angle, angularSpeed });
    }
    if (frame % 200 === 0) {
      // fuel cell (small glowing circle)
      const size = 15;
      fuels.push({ w: size, h: size, x: W, y: Math.random() * (H - size), pulsate: 0 });
    }
  }

  function update() {
    // Player movement
    if (keys.up) ship.vy = -SPEED;
    else if (keys.down) ship.vy = SPEED;
    else ship.vy *= 0.9; // dampen
    ship.y += ship.vy + GRAVITY;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // Ship particle trail
    if (particles.length < maxParticles) {
      particles.push({
        x: ship.x,
        y: ship.y + ship.h / 2,
        vx: -1 - Math.random() * 1,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: 1,
      });
    }
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
    });
    // Remove faded particles
    while (particles.length && particles[0].alpha <= 0) particles.shift();

    // Move obstacles left and rotate
    obstacles.forEach(o => {
      o.x -= 4;
      if (typeof o.angle === 'number') {
        o.angle += o.angularSpeed;
      }
    });
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // Move fuel cells left and animate pulsate
    fuels.forEach(f => {
      f.x -= 4;
      f.pulsate = (f.pulsate + 0.1) % (Math.PI * 2);
    });
    fuels = fuels.filter(f => f.x + f.w > 0);
    // Twinkle stars
    stars.forEach(s => {
      s.alpha += s.twinkle * (Math.random() > 0.5 ? 1 : -1);
      if (s.alpha > 1) s.alpha = 1;
      if (s.alpha < 0) s.alpha = 0;
    });

    // Collision detection (AABB)
    const collide = (a, b) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    for (const o of obstacles) {
      if (collide(ship, o)) {
        playTone(100, 0.3); // crash sound
        running = false; // lose
        return;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (collide(ship, fuels[i])) {
        fuel = Math.min(100, fuel + 20);
        playTone(600, 0.1); // collect fuel
        fuels.splice(i, 1);
      }
    }
    // Fuel consumption
    fuel -= 0.02;
    if (fuel <= 0) running = false;
    score++;
  }

  function draw() {
    // Clear with gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Starfield background (twinkling stars)
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // Ship particle trail
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Ship (draw as triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Obstacles (rotating)
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      if (typeof o.angle === 'number') ctx.rotate(o.angle);
      ctx.fillStyle = '#f00';
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    });
    // Fuel cells (pulsating glow)
    fuels.forEach(f => {
      const radius = f.w / 2;
      const glow = Math.abs(Math.sin(f.pulsate)) * 0.5 + 0.5; // 0.5-1
      ctx.save();
      ctx.fillStyle = `rgba(255,255,0,${glow})`;
      ctx.beginPath();
      ctx.arc(f.x + radius, f.y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}`, 10, 40);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
      ctx.fillText(`Final Score: ${score}`, W / 2 - 70, H / 2 + 30);
      return;
    }
    frame++;
    spawn();
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start
  requestAnimationFrame(loop);
})();
