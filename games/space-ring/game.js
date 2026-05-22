// Simple orbit‑shoot game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);
  // generate static star background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
  }

  // ---- Game settings ----
  const planet = { x: W / 2, y: H / 2, r: 40, health: 5 };
  const ship = {
    orbitR: 120,
    angle: 0,
    size: 10,
    fuel: 100,
    speed: 0.03, // radians per frame
  };
  const bullets = [];
  const meteors = [];
  const particles = [];
  let lastMeteor = 0;
  const keys = {};

  // ---- Input ----
  window.addEventListener('keydown', e => { keys[e.code] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ---- Audio ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playLaser() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  // ---- Helpers ----
  function spawnMeteor() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * H; }
    else if (side === 1) { x = W; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = 0; }
    else { x = Math.random() * W; y = H; }
    const angle = Math.atan2(planet.y - y, planet.x - x);
    const speed = 1 + Math.random() * 1.5;
    meteors.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 8 });
  }

  function fireBullet() {
    if (ship.fuel <= 0) return;
    ship.fuel -= 1; // consume fuel per shot
    const sx = planet.x + Math.cos(ship.angle) * ship.orbitR;
    const sy = planet.y + Math.sin(ship.angle) * ship.orbitR;
    const speed = 4;
    const vx = Math.cos(ship.angle) * speed;
    const vy = Math.sin(ship.angle) * speed;
    bullets.push({ x: sx, y: sy, vx, vy, r: 3, life: 60 });
    playLaser();
  }

  function update() {
    // ship rotation
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= ship.speed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += ship.speed;
    // fire
    if (keys['Space']) { fireBullet(); keys['Space'] = false; }

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy; b.life--;
      if (b.life <= 0) bullets.splice(i, 1);
    }

    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy;
      // collision with planet
      const dxp = m.x - planet.x, dyp = m.y - planet.y;
      if (dxp * dxp + dyp * dyp < (m.r + planet.r) ** 2) {
        planet.health--;
        // create explosion particles
        for (let p = 0; p < 8; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: m.x,
            y: m.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: Math.random() * 2 + 1,
            life: 30,
            color: '#ff8'
          });
        }
        meteors.splice(i, 1);
        continue;
      }
      // collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const dx = m.x - b.x, dy = m.y - b.y;
        if (dx * dx + dy * dy < (m.r + b.r) ** 2) {
          meteors.splice(i, 1);
          bullets.splice(j, 1);
          break;
        }
      }
    }
    // particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // spawn meteors periodically
    const now = Date.now();
    if (now - lastMeteor > 1500) { spawnMeteor(); lastMeteor = now; }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // orbital path
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, ship.orbitR, 0, Math.PI * 2);
    ctx.stroke();
    // planet with gradient
    const grad = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // ship (triangle pointing outward) with glow
    const sx = planet.x + Math.cos(ship.angle) * ship.orbitR;
    const sy = planet.y + Math.sin(ship.angle) * ship.orbitR;
    // glow effect
    ctx.shadowColor = 'rgba(0,255,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(
      sx + Math.cos(ship.angle + Math.PI * 0.6) * ship.size,
      sy + Math.sin(ship.angle + Math.PI * 0.6) * ship.size
    );
    ctx.lineTo(
      sx + Math.cos(ship.angle - Math.PI * 0.6) * ship.size,
      sy + Math.sin(ship.angle - Math.PI * 0.6) * ship.size
    );
    ctx.closePath();
    ctx.fill();
    // reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // bullets with glow
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // meteors with gradient
    meteors.forEach(m => {
      const gradM = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
      gradM.addColorStop(0, '#f66');
      gradM.addColorStop(1, '#800');
      ctx.fillStyle = gradM;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // particles (explosions) rendering
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('Health: ' + planet.health, 10, 20);
    ctx.fillText('Fuel: ' + ship.fuel, 10, 40);
    if (planet.health <= 0) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  function loop() {
    if (planet.health > 0 && ship.fuel > 0) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with Game Over
    }
  }

  loop();
})();
