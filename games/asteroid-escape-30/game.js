// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // ------- ship -------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height * 0.85,
    size: 20,
    speed: 4,
    shield: 100,
  };

const keys = {};
  let audioStarted = false;
  const ensureAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', e => {
    // unlock audio on first interaction
    if (!audioStarted) {
      ensureAudio();
      audioStarted = true;
    }
    keys[e.key] = true;
    // play thrust sound on movement keys
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)) {
      playTone(300, 0.05);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ------- asteroids -------
  const asteroids = [];
  const spawnAsteroid = () => {
    const radius = 10 + Math.random() * 20;
    asteroids.push({
      x: Math.random() * canvas.width,
      y: -radius,
      r: radius,
      dy: 2 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2,
      dAngle: (Math.random() - 0.5) * 0.02,
    });
  };
  let spawnTimer = 0;

  // ------- helpers -------
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  // ------- audio -------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
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
  };

  const updateShip = () => {
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // keep within bounds
    ship.x = Math.max(ship.size, Math.min(canvas.width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(canvas.height - ship.size, ship.y));
  };

  const updateAsteroids = () => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.dy;
      a.angle += a.dAngle; // rotate asteroid
      // collision with ship (approximate by circle around ship center)
      if (dist(a.x, a.y, ship.x, ship.y) < a.r + ship.size) {
        ship.shield -= 20;
        // collision sound
        playTone(150, 0.2);
        asteroids.splice(i, 1);
        continue;
      }
      // remove off‑screen
      if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
    }
  };

  const stars = [];
  const initStars = () => {
    const count = 100;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };
  initStars();

  const drawStars = () => {
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#000020');
    bg.addColorStop(1, '#000010');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // move and draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  };

  const drawShip = () => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // ship gradient
    const grad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#050');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.strokeStyle = '#0c0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const drawAsteroids = () => {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      // asteroid gradient
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawShield = () => {
    // bar background
    ctx.fillStyle = '#222';
    ctx.fillRect(10, 10, 104, 14);
    // bar value
    ctx.fillStyle = '#0ff';
    ctx.fillRect(12, 12, ship.shield, 10);
    // border
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 104, 14);
  };

  const gameOver = () => {
    // game over tone
    playTone(80, 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  };

  const loop = () => {
    if (ship.shield <= 0) {
      drawStars();
      gameOver();
      return;
    }
    drawStars();
    updateShip();
    updateAsteroids();
    drawShip();
    drawAsteroids();
    drawShield();
    // spawn new asteroid every ~1.5 seconds
    spawnTimer += 1 / 60;
    if (spawnTimer > 1.5) {
      spawnAsteroid();
      spawnTimer = 0;
    }
    requestAnimationFrame(loop);
  };

  // start
  requestAnimationFrame(loop);
})();
