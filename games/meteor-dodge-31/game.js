// Simple Meteor Dodge game
// Canvas element with id="game" must exist in HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  function playLaser() { playSound(800, 'square', 0.07); }
  function playExplosion() { playSound(180, 'sawtooth', 0.2); }
  function playGameOver() { playSound(100, 'triangle', 0.5); }
  // Ensure audio context resumes on first user interaction
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }
  document.addEventListener('keydown', resumeAudio, {once: true});
  canvas.addEventListener('mousedown', resumeAudio, {once: true});
  canvas.addEventListener('touchstart', resumeAudio, {once: true});

  // Game objects
  const ship = {
    w: 50,
    h: 20,
    x: width / 2 - 25,
    y: height - 30,
    speed: 6,
    color: '#0f0'
  };
  const lasers = [];
  const meteors = [];
  const stars = [];
  // initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  let lastMeteor = 0;
  let meteorInterval = 1200; // ms
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  let left = false, right = false, firing = false;
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') right = true;
    if (e.key === ' ') firing = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') right = false;
    if (e.key === ' ') firing = false;
  });
  canvas.addEventListener('mousedown', () => firing = true);
  canvas.addEventListener('mouseup', () => firing = false);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); firing = true; });
  canvas.addEventListener('touchend', e => { e.preventDefault(); firing = false; });

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 1 + Math.random() * 1.5 + (performance.now() - startTime) / 30000 // gradually faster
    });
  }

  function update(dt) {
    if (gameOver) return;
    // move ship
    if (left) ship.x -= ship.speed;
    if (right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // fire laser
    if (firing && (lastTime - lastLaser > 200)) {
      lasers.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10, speed: 8 });
      playLaser();
      lastLaser = lastTime;
    }

    // update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y + l.h < 0) lasers.splice(i, 1);
    }

    // spawn meteors over time
    if (lastTime - lastMeteor > meteorInterval) {
      spawnMeteor();
      lastMeteor = lastTime;
      // speed up spawning
      meteorInterval = Math.max(300, meteorInterval - 20);
    }

    // update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (m.y > height) meteors.splice(i, 1);
    }
    // update stars (simple drift)
    for (let s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // collision detection
    // ship vs meteors
    for (const m of meteors) {
      if (rectIntersect(ship, m)) {
        gameOver = true;
        playGameOver();
        break;
      }
    }
    // lasers vs meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (rectIntersect(l, m)) {
          meteors.splice(i, 1);
          lasers.splice(j, 1);
          playExplosion();
          break;
        }
      }
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
     // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // lasers with glow
    lasers.forEach(l => {
      const grad = ctx.createLinearGradient(0, l.y, 0, l.y + l.h);
      grad.addColorStop(0, 'rgba(255,255,0,0)');
      grad.addColorStop(0.5, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(l.x, l.y, l.w, l.h);
    });

    // meteors as circles with radial gradient
    meteors.forEach(m => {
      const radGrad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.2,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      radGrad.addColorStop(0, '#aaa');
      radGrad.addColorStop(1, '#333');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // game over text
    if (gameOver) {
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastLaser = 0;
  const startTime = performance.now();
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
