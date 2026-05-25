// Simple Orbit Dash game
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
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
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  }
  function playBoost() { playTone(400, 100); }
  function playCollect() { playTone(800, 80); }
  function playCrash() { playTone(150, 300); }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  const center = { x: W / 2, y: H / 2 };
  const planetR = 30;
  const ship = { angle: 0, radius: 120, speed: 0.0015, boost: 0.004, size: 8 };
  const fuelCells = [];
  const meteors = [];
  const maxFuel = 5;
  let fuel = maxFuel;
  let score = 0;
  let gameOver = false;

  function spawnFuel() {
    if (fuelCells.length < 3 && Math.random() < 0.02) {
      const a = Math.random() * Math.PI * 2;
      const r = planetR + 100 + Math.random() * 150;
      fuelCells.push({ angle: a, radius: r });
    }
  }

  function spawnMeteor() {
    if (meteors.length < 3 && Math.random() < 0.01) {
      const a = Math.random() * Math.PI * 2;
      const r = planetR + 80 + Math.random() * 200;
      const dr = (Math.random() - 0.5) * 0.004; // rotate direction
      meteors.push({ angle: a, radius: r, dAngle: dr, size: 12 });
    }
  }

  function update(dt) {
    if (gameOver) return;
    // boost on click (audio)
    ship.angle += ship.speed * dt;
    // fuel consumption
    fuel -= dt * 0.00002; // passive drain
    if (fuel <= 0) gameOver = true;
    // move fuel cells
    fuelCells.forEach((f, i) => {
      const dx = Math.cos(f.angle) * f.radius - Math.cos(ship.angle) * ship.radius;
      const dy = Math.sin(f.angle) * f.radius - Math.sin(ship.angle) * ship.radius;
        if (Math.hypot(dx, dy) < ship.size + 5) {
          fuel = Math.min(maxFuel, fuel + 1);
          score += 10;
          playCollect();
          fuelCells.splice(i, 1);
        }
    });
    // meteors
    meteors.forEach((m, i) => {
      m.angle += m.dAngle * dt;
      const dx = Math.cos(m.angle) * m.radius - Math.cos(ship.angle) * ship.radius;
      const dy = Math.sin(m.angle) * m.radius - Math.sin(ship.angle) * ship.radius;
if (Math.hypot(dx, dy) < ship.size + m.size) {
          playCrash();
          gameOver = true;
        }
      // remove if out of bounds
      if (m.radius > Math.max(W, H)) meteors.splice(i, 1);
    });
  }

  function initStars() {
    const starCount = 100;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
    return stars;
  }
  const stars = initStars();

  function draw() {
    // clear background to black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // stars background
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // twinkle
      s.alpha += (Math.random() - 0.5) * 0.02;
      if (s.alpha < 0.3) s.alpha = 0.3;
      if (s.alpha > 0.8) s.alpha = 0.8;
    });
    // planet with gradient
    const grad = ctx.createRadialGradient(center.x, center.y, planetR * 0.2, center.x, center.y, planetR);
    grad.addColorStop(0, '#555');
    grad.addColorStop(1, '#111');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planetR, 0, Math.PI * 2);
    ctx.fill();
    // ship as triangle
    const sx = center.x + Math.cos(ship.angle) * ship.radius;
    const sy = center.y + Math.sin(ship.angle) * ship.radius;
    const tip = { x: sx, y: sy };
    const left = { x: sx + Math.cos(ship.angle + Math.PI * 0.75) * ship.size, y: sy + Math.sin(ship.angle + Math.PI * 0.75) * ship.size };
    const right = { x: sx + Math.cos(ship.angle - Math.PI * 0.75) * ship.size, y: sy + Math.sin(ship.angle - Math.PI * 0.75) * ship.size };
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
    // fuel cells with glow
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 8;
    fuelCells.forEach(f => {
      const fx = center.x + Math.cos(f.angle) * f.radius;
      const fy = center.y + Math.sin(f.angle) * f.radius;
      ctx.beginPath();
      ctx.arc(fx, fy, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // meteors
    ctx.fillStyle = '#ff4444';
    meteors.forEach(m => {
      const mx = center.x + Math.cos(m.angle) * m.radius;
      const my = center.y + Math.sin(m.angle) * m.radius;
      ctx.beginPath();
      ctx.arc(mx, my, m.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(1)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    spawnFuel();
    spawnMeteor();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // boost listener
  canvas.addEventListener('mousedown', () => {
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playBoost();
    ship.speed += ship.boost;
    fuel = Math.max(0, fuel - 0.2);
  });
  requestAnimationFrame(loop);
})();
