// Meteor Dodge game
// Assumes a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  const initAudio = () => {
    if (audioInitialized) return;
    audioInitialized = true;
    // resume context on first user interaction
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };
  const playLaser = () => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };
  const playExplosion = () => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };
  const playGameOver = () => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };
  // Resize to fill the container or window.
  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
    initStars(); // regenerate stars on resize
  };
  resize();
  window.addEventListener('resize', resize);

  // Star field for background
  const stars = [];
  const initStars = () => {
    const count = Math.floor(canvas.width * canvas.height * 0.00005);
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        twinkle: Math.random()
      });
    }
  };
  initStars();

  // Ship definition
  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 7,
    color: '#0f0',
  };

  // Input handling – mouse moves ship horizontally, click fires.
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    // Clamp within canvas
    ship.x = Math.max(ship.w / 2, Math.min(canvas.width - ship.w / 2, ship.x));
  });
  const lasers = [];
  const fireLaser = () => {
    lasers.push({ x: ship.x, y: ship.y, w: 2, h: 10, speed: 10, color: '#ff0' });
    playLaser();
  };
  canvas.addEventListener('mousedown', fireLaser);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') fireLaser();
  });

  // Meteors
  const meteors = [];
  let meteorSpawnTimer = 0;
  let speedMultiplier = 1;
  let lastTime = 0;
  let gameOver = false;

  const spawnMeteor = () => {
    const size = 20 + Math.random() * 30;
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 1.5 + Math.random() * 1.5,
      color: '#f44',
    });
  };

  const checkCollision = (a, b) => {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  };

  const update = (timestamp) => {
    if (gameOver) return;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

// Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw starry background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001020');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars
  ctx.save();
  ctx.fillStyle = '#fff';
  for (let s of stars) {
    // Simple twinkling animation
    const alpha = 0.5 + 0.5 * Math.sin(s.twinkle + performance.now() * 0.002);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Draw ship with glow
  ctx.save();
  ctx.shadowColor = 'rgba(0,255,0,0.7)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - ship.h / 2);
  ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
  ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

    // Update lasers
    ctx.fillStyle = '#ff0';
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y + l.h < 0) {
        lasers.splice(i, 1);
        continue;
      }
      ctx.fillRect(l.x - l.w / 2, l.y - l.h / 2, l.w, l.h);
    }

    // Spawn meteors
    meteorSpawnTimer += delta;
    if (meteorSpawnTimer > 1000) {
      spawnMeteor();
      meteorSpawnTimer = 0;
    }

    // Increase difficulty over time
    speedMultiplier += delta * 0.00002; // subtle acceleration

    // Update meteors
    // Draw meteors with radial gradient
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * speedMultiplier;
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#ff8080');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();

      // Collision with ship
      if (checkCollision(m, { x: ship.x - ship.w / 2, y: ship.y - ship.h / 2, w: ship.w, h: ship.h })) {
        gameOver = true;
      }
      // Meteor reaches bottom
      if (m.y + m.h >= canvas.height) {
        gameOver = true;
      }
      // Collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
if (checkCollision(m, { x: l.x - l.w / 2, y: l.y - l.h / 2, w: l.w, h: l.h })) {
            // remove both
            meteors.splice(i, 1);
            lasers.splice(j, 1);
            playExplosion();
            break;
          }
      }
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
})();
