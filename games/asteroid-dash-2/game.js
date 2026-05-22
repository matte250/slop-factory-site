// Minimal Asteroid Dash game
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // starfield for background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * 0.5 + 0.5
  }));

  const ship = {x: 80, y: H / 2, r: 12, vy: 0, thrusting: false};
  const GRAVITY = 0.4, THRUST = -8;
  let asteroids = [];
  // particles for thrust visual effect
  let particles = [];
  let speed = 2, spawnTimer = 0, score = 0, lastTime = 0, running = true;

  const rand = (min, max) => Math.random() * (max - min) + min;
  const createAsteroid = () => {
    const r = rand(10, 30);
    const y = rand(r, H - r);
    asteroids.push({x: W + r, y, r, vx: -speed - rand(0, 2)});
  };
  const collide = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // background hum
  let bgOsc;
  const startBackground = () => {
    if (bgOsc) return;
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 150;
    gain.gain.value = 0.02;
    bgOsc.connect(gain);
    gain.connect(audioCtx.destination);
    bgOsc.start();
  };
  const stopBackground = () => {
    if (!bgOsc) return;
    bgOsc.stop();
    bgOsc.disconnect();
    bgOsc = null;
  };

  const update = (dt) => {
    // ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    if (ship.y + ship.r > H) { ship.y = H - ship.r; ship.vy = 0; }
    if (ship.y - ship.r < 0) { ship.y = ship.r; ship.vy = 0; }
    // reset thrust flag after applying physics
    ship.thrusting = false;
    // asteroids
    asteroids.forEach(a => a.x += a.vx);
    asteroids = asteroids.filter(a => a.x + a.r > 0);
    // spawn
    spawnTimer -= dt;
    if (spawnTimer <= 0) { createAsteroid(); spawnTimer = rand(500, 1200); }
    // collision
    if (asteroids.some(a => collide(a, ship))) {
      running = false;
      playTone(150, 0.5); // collision boom
      stopBackground();
    }
    // score & speed increase
    score += dt / 1000;
    if (Math.floor(score) % 10 === 0) speed = 2 + score / 10;
    // particles decay and movement
    particles.forEach(p => { p.life -= 0.02; p.x += p.vx; p.y += p.vy; });
    particles = particles.filter(p => p.life > 0);
    // star twinkle fluctuation
    stars.forEach(s => { s.twinkle = 0.5 + Math.random() * 0.5; });
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    // stars background with twinkle
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.twinkle;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // ship thrust flame
    if (ship.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x - ship.r, ship.y);
      ctx.lineTo(ship.x - ship.r - 10, ship.y - 5);
      ctx.lineTo(ship.x - ship.r - 10, ship.y + 5);
      ctx.closePath();
      ctx.fill();
    }
    // ship
    ctx.fillStyle = '#0ff';
    ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2); ctx.fill();
    // asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    });
    // particles for thrust
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W/2, H/2);
    }
  };

  const loop = (ts) => {
    if (!lastTime) lastTime = ts;
    const dt = ts - lastTime;
    lastTime = ts;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  };

  // input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === ' ') {
      ship.vy = THRUST;
      ship.thrusting = true;
      // ensure audio context is running
      audioCtx.resume();
      playTone(600, 0.05); // thrust sound
      // emit thrust particles
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: ship.x - ship.r - Math.random() * 5,
          y: ship.y + (Math.random() - 0.5) * 8,
          r: Math.random() * 2 + 1,
          vx: -2 - Math.random() * 2,
          vy: (Math.random() - 0.5) * 1,
          life: 0.5
        });
      }
    }
  });
  canvas.addEventListener('mousedown', () => {
    ship.vy = THRUST;
    ship.thrusting = true;
    audioCtx.resume();
    playTone(600, 0.05);
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: ship.x - ship.r - Math.random() * 5,
        y: ship.y + (Math.random() - 0.5) * 8,
        r: Math.random() * 2 + 1,
        vx: -2 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 1,
        life: 0.5
      });
    }
  });
  // start background hum after first interaction
  startBackground();

  requestAnimationFrame(loop);
})();
