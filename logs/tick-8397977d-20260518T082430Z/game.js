// Minimal Orbital Defender game
// Assumes a <canvas id="game"></canvas> present in the page

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  function playLaser() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  function playExplosion() {
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
  }
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // generate simple starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const planet = { x: canvas.width / 2, y: canvas.height / 2, r: 40 };
  const ship = { angle: 0, r: 80, size: 10, cooldown: 0 };
  const projectiles = [];
  const asteroids = [];
  let gameOver = false;
  let score = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    // random angle around planet
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(canvas.width, canvas.height);
    const x = planet.x + Math.cos(angle) * dist;
    const y = planet.y + Math.sin(angle) * dist;
    const speed = 1 + Math.random() * 1.5;
    const vx = (planet.x - x) / dist * speed;
    const vy = (planet.y - y) / dist * speed;
    const r = 8 + Math.random() * 12;
    asteroids.push({ x, y, vx, vy, r });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= 2 * Math.PI / 180 * dt;
    if (keys['ArrowRight']) ship.angle += 2 * Math.PI / 180 * dt;
    // Fire
    if (keys['Space'] && ship.cooldown <= 0) {
      const px = planet.x + Math.cos(ship.angle) * ship.r;
      const py = planet.y + Math.sin(ship.angle) * ship.r;
      const speed = 4;
      projectiles.push({ x: px, y: py, vx: Math.cos(ship.angle) * speed, vy: Math.sin(ship.angle) * speed, life: 60 });
      playLaser();
      ship.cooldown = 20; // frames
    }
    ship.cooldown = Math.max(0, ship.cooldown - 1);

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) projectiles.splice(i, 1);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // collision with planet
      const dx = a.x - planet.x;
      const dy = a.y - planet.y;
      if (Math.hypot(dx, dy) < a.r + planet.r) {
        gameOver = true;
        break;
      }
      // collision with projectiles
      for (let j = projectiles.length - 1; j >= 0; j--) {
        const p = projectiles[j];
        if (Math.hypot(a.x - p.x, a.y - p.y) < a.r + 2) {
          score += 10;
          playExplosion();
          asteroids.splice(i, 1);
          projectiles.splice(j, 1);
          break;
        }
      }
    }

    // Periodically spawn asteroids
    if (Math.random() < 0.02) spawnAsteroid();
  }

  function draw() {
    // optional motion blur effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield background
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with radial gradient (already set in draw)
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // ship as triangle with gradient
    const sx = planet.x + Math.cos(ship.angle) * ship.r;
    const sy = planet.y + Math.sin(ship.angle) * ship.r;
    const tipX = sx + Math.cos(ship.angle) * ship.size * 1.5;
    const tipY = sy + Math.sin(ship.angle) * ship.size * 1.5;
    const leftX = sx + Math.cos(ship.angle + Math.PI / 2) * ship.size;
    const leftY = sy + Math.sin(ship.angle + Math.PI / 2) * ship.size;
    const rightX = sx + Math.cos(ship.angle - Math.PI / 2) * ship.size;
    const rightY = sy + Math.sin(ship.angle - Math.PI / 2) * ship.size;
    const shipGrad = ctx.createLinearGradient(sx, sy, tipX, tipY);
    shipGrad.addColorStop(0, '#00ff00');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    // projectiles as glowing circles
    for (const p of projectiles) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4);
      grad.addColorStop(0, '#ffff88');
      grad.addColorStop(1, '#ff8800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // asteroids with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
    ctx.textAlign = 'start';
  }
    // asteroids
    ctx.fillStyle = '#888888';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
    ctx.textAlign = 'start';
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 16.666; // approximate 60fps frames
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
