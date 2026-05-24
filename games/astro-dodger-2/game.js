// Astro Dodger – minimal canvas game
// Canvas must have id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // player ship
  const ship = {
    w: 30,
    h: 40,
    x: width / 2,
    y: height - 50,
    speed: 5,
    vy: 0,
    boost: -8,
    boostTime: 0,
  };

  // asteroids
  const asteroids = [];
  const asteroidFreq = 1000; // ms between spawns
  const asteroidSpeedBase = 2;
  let lastSpawn = 0;
  // starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 0.5 + 0.2,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  let score = 0;
  let missedBoosts = 0;
  const maxMissedBoosts = 3;
  let gameOver = false;

  // input handling
  let boostPressed = false;
  // audio setup
  let audioCtx = null;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };
  const playBoost = () => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  };
  const playExplosion = () => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };
  const onBoost = () => {
    if (ship.boostTime <= 0) {
      ship.vy = ship.boost;
      ship.boostTime = 15; // frames of boost
      boostPressed = true;
      playBoost();
    }
  };
  document.addEventListener('keydown', e => { if (e.code === 'Space') onBoost(); });
  canvas.addEventListener('pointerdown', onBoost);

  const spawnAsteroid = () => {
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: asteroidSpeedBase + Math.random() * 2 + score / 10000,
    });
  };

  const rectsCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = (dt) => {
    if (gameOver) return;
    // ship motion
    ship.y += ship.vy;
    if (ship.boostTime > 0) ship.boostTime--;
    else ship.vy = 0;
    // keep ship within bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.w > width) ship.x = width - ship.w;
    if (ship.y < 0) ship.y = 0;
    if (ship.y + ship.h > height) ship.y = height - ship.h;

    // asteroids
    const now = performance.now();
    if (now - lastSpawn > asteroidFreq) {
      spawnAsteroid();
      lastSpawn = now;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (rectsCollide(ship, a)) { playExplosion(); gameOver = true; break; }
      if (a.y > height) {
        // missed boost opportunity if ship didn't boost within a short window
        if (!boostPressed) missedBoosts++;
        asteroids.splice(i, 1);
      }
    }
    // update starfield positions for scrolling effect
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    boostPressed = false;
    score += dt;
    if (missedBoosts >= maxMissedBoosts) gameOver = true;
  };

  const draw = () => {
    // semi‑transparent overlay for motion blur
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);

    // starfield background
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1.0;

    // ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // asteroids as circles with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#ccc');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score / 1000)}`, 10, 20);
    ctx.fillText(`Missed: ${missedBoosts}/${maxMissedBoosts}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  let lastTime = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
