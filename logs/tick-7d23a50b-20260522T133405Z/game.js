// Orbit Dodge – Enhanced graphics
// Assumes an HTML <canvas id="game"></canvas> exists.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // ---------- Resize & background ----------
  let stars = [];
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // generate simple star field
    const starCount = Math.floor((canvas.width * canvas.height) / 8000);
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
      });
    }
    // recompute orbit radius based on new size
    state.radius = Math.min(canvas.width, canvas.height) * 0.35;
  };
  window.addEventListener('resize', resize);
  resize();

  // ---------- Game state ----------
  const state = {
    radius: 0, // set in resize()
    angle: 0,
    angularVelocity: 0.018,
    speedFactor: 1,
    debris: [],
    time: 0,
    over: false,
    // trail stores last few satellite positions for a motion‑blur effect
    trail: [],
  };

  // ---------- Input ----------
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ---------- Debris ----------
  const spawnDebris = () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(canvas.width, canvas.height) * 1.1; // start just outside view
    const speed = 1 + Math.random() * 2;
    const radius = Math.random() * 4 + 3; // varied size
    const hue = Math.random() * 40 + 200; // bluish‑gray
    state.debris.push({ angle, distance, speed, radius, hue });
  };

  // ---------- Collision ----------
  const checkCollision = () => {
    const satX = canvas.width / 2 + state.radius * Math.cos(state.angle);
    const satY = canvas.height / 2 + state.radius * Math.sin(state.angle);
    for (const d of state.debris) {
      const dX = canvas.width / 2 + d.distance * Math.cos(d.angle);
      const dY = canvas.height / 2 + d.distance * Math.sin(d.angle);
      const dx = satX - dX;
      const dy = satY - dY;
      const distSq = dx * dx + dy * dy;
      const collDist = 5 + d.radius; // satellite radius 5
      if (distSq < collDist * collDist) {
        state.over = true;
        break;
      }
    }
  };

  // ---------- Main loop ----------
  const loop = () => {
    if (state.over) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`Survived: ${state.time.toFixed(1)}s`, canvas.width / 2, canvas.height / 2 + 20);
      return;
    }

    // time
    state.time += 1 / 60;

    // input
    if (keys['ArrowLeft']) state.angle -= state.angularVelocity * state.speedFactor;
    if (keys['ArrowRight']) state.angle += state.angularVelocity * state.speedFactor;
    if (keys['ArrowUp']) state.speedFactor = Math.min(state.speedFactor + 0.01, 3);
    if (keys['ArrowDown']) state.speedFactor = Math.max(state.speedFactor - 0.01, 0.5);

    // spawn debris
    if (Math.random() < 0.018) spawnDebris();

    // update debris
    for (let i = state.debris.length - 1; i >= 0; i--) {
      const d = state.debris[i];
      d.distance -= d.speed;
      if (d.distance < 0) state.debris.splice(i, 1);
    }

    // collision
    checkCollision();

    // store trail (max 12 points)
    const satX = canvas.width / 2 + state.radius * Math.cos(state.angle);
    const satY = canvas.height / 2 + state.radius * Math.sin(state.angle);
    state.trail.push({ x: satX, y: satY });
    if (state.trail.length > 12) state.trail.shift();

    // ---------- Rendering ----------
    // background gradient
    const bgGrad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.1,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height)
    );
    bgGrad.addColorStop(0, '#0b0c10');
    bgGrad.addColorStop(1, '#1a1c23');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // planet with glow
    const planetX = canvas.width / 2;
    const planetY = canvas.height / 2;
    const planetGrad = ctx.createRadialGradient(planetX, planetY, 10, planetX, planetY, 30);
    planetGrad.addColorStop(0, '#3b5b9e');
    planetGrad.addColorStop(1, '#0c1a36');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 30, 0, Math.PI * 2);
    ctx.fill();
    // subtle outer glow
    ctx.shadowColor = 'rgba(30,70,150,0.6)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 32, 0, Math.PI * 2);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // satellite trail (fading)
    for (let i = 0; i < state.trail.length; i++) {
      const p = state.trail[i];
      const alpha = (i + 1) / state.trail.length * 0.4;
      ctx.fillStyle = `rgba(231,76,60,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // satellite (with optional thrust)
    const satGrad = ctx.createRadialGradient(satX, satY, 2, satX, satY, 5);
    satGrad.addColorStop(0, '#ff6b6b');
    satGrad.addColorStop(1, '#c0392b');
    ctx.fillStyle = satGrad;
    ctx.beginPath();
    ctx.arc(satX, satY, 5, 0, Math.PI * 2);
    ctx.fill();
    // thrust flame when accelerating (speedFactor > 1)
    if (state.speedFactor > 1.2) {
      const flameLen = 10 * (state.speedFactor - 1);
      const flameX = satX - Math.cos(state.angle) * (5 + flameLen);
      const flameY = satY - Math.sin(state.angle) * (5 + flameLen);
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(satX - Math.cos(state.angle) * 5, satY - Math.sin(state.angle) * 5);
      ctx.lineTo(flameX, flameY);
      ctx.lineTo(satX - Math.cos(state.angle + 0.3) * 5, satY - Math.sin(state.angle + 0.3) * 5);
      ctx.closePath();
      ctx.fill();
    }

    // debris (varied size & color)
    for (const d of state.debris) {
      const x = canvas.width / 2 + d.distance * Math.cos(d.angle);
      const y = canvas.height / 2 + d.distance * Math.sin(d.angle);
      const grad = ctx.createRadialGradient(x, y, d.radius * 0.3, x, y, d.radius);
      grad.addColorStop(0, `hsl(${d.hue},70%,80%)`);
      grad.addColorStop(1, `hsl(${d.hue},30%,40%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${state.time.toFixed(1)}s`, 10, 20);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();