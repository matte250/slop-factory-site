// Simple "Gravity Rescue" game (see IDEA.md)

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // --- game objects ---
  const ship = { x: W / 2, y: H / 2, r: 12, vx: 0, vy: 0, thrust: 0.2 };
  const asteroids = [];
  const astronauts = [];
  const stars = [];
  let fuel = 100;
  let gameOver = false;
  let score = 0;

  // Audio setup using Web Audio API
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
  function playThrust() { playTone(400, 0.08); }
  function playExplosion() { playTone(100, 0.3); }
  function playRescue() { playTone(800, 0.12); }
  // ensure context resumes on first user interaction
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }


  // populate asteroids
  for (let i = 0; i < 5; i++) {
    asteroids.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 15 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      angle: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 0.02,
    });
  }

  // populate astronauts
  for (let i = 0; i < 3; i++) {
    astronauts.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 8,
      rescued: false,
    });
  }

  // generate starfield
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
    });
  }

  // handle thrust on click
  canvas.addEventListener('mousedown', (e) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - ship.x;
    const dy = my - ship.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    // normalized thrust direction
    ship.vx += (dx / len) * ship.thrust;
    ship.vy += (dy / len) * ship.thrust;
    fuel = Math.max(0, fuel - 1);
  });

  function update() {
    if (gameOver) return;
    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;

    // move asteroids and rotate
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      a.angle = (a.angle + a.angularVelocity) % (Math.PI * 2);
      if (a.x < 0) a.x += W;
      if (a.x > W) a.x -= W;
      if (a.y < 0) a.y += H;
      if (a.y > H) a.y -= H;
    });

    // check collisions ship-asteroid
    for (const a of asteroids) {
      const d = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (d < ship.r + a.r) {
        gameOver = true;
        break;
      }
    }

    // check rescues
    astronauts.forEach(ast => {
      if (ast.rescued) return;
      const d = Math.hypot(ship.x - ast.x, ship.y - ast.y);
      if (d < ship.r + ast.r) {
        ast.rescued = true;
        score++;
      }
    });

    // lose if fuel out
    if (fuel <= 0) gameOver = true;
  }

  function draw() {
    // Background: starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // Ship: draw a rotated triangle pointing in direction of velocity
    ctx.save();
    const angle = Math.atan2(ship.vy, ship.vx) + Math.PI / 2;
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#1e90ff';
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.6, ship.r);
    ctx.lineTo(-ship.r * 0.6, ship.r);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (ship.vx !== 0 || ship.vy !== 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, ship.r);
      ctx.lineTo(ship.r * 0.3, ship.r + 8);
      ctx.lineTo(-ship.r * 0.3, ship.r + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Asteroids: rough polygons
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle || 0);
      ctx.beginPath();
      const points = 8;
      const step = (Math.PI * 2) / points;
      for (let i = 0; i < points; i++) {
        const rad = a.r + Math.random() * 3 - 1.5;
        const px = Math.cos(i * step) * rad;
        const py = Math.sin(i * step) * rad;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Astronauts
    ctx.fillStyle = '#0ff';
    astronauts.forEach(ast => {
      if (ast.rescued) return;
      ctx.beginPath();
      ctx.arc(ast.x, ast.y, ast.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlay
    ctx.fillStyle = '#ff0';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
