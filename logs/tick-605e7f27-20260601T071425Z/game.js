// Cosmic Runner – simple endless runner on canvas id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  // initialize starfield particles
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  // nebula particles for depth
  const nebulaCount = 30;
  const nebulae = [];
  for (let i = 0; i < nebulaCount; i++) {
    nebulae.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 30 + 20,
      color: `rgba(100,0,${Math.floor(150 + Math.random()*105)},0.05)`
    });
  }

  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure audio starts after user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once: true});
  window.addEventListener('keydown', resumeAudio, {once: true});

  function playTone(freq, duration = 0.1, type = 'square') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playBoost() { playTone(200, 0.05, 'sawtooth'); }
  function playCollect() { playTone(600, 0.07, 'triangle'); }
  function playCollision() { playTone(100, 0.3, 'square'); }


  // Game state
  const ship = { x: 80, y: height / 2, w: 30, h: 15, vy: 0 };
  let isBoosting = false;
  const obstacles = [];
  const fuels = [];
  let fuel = 100;
  let score = 0;
  let lastTime = 0;

  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    const h = 20 + Math.random() * 30;
    obstacles.push({ x: width, y: Math.random() * (height - h), w: 20, h, speed: 3 + Math.random() * 2 });
  }
  function spawnFuel() {
    fuels.push({ x: width, y: Math.random() * (height - 15), r: 8, speed: 3 });
  }

  function update(dt) {
  // boost flag for rendering flame
  const boosting = keys.ArrowRight && fuel > 0;
  isBoosting = boosting;
  if (boosting) playBoost();
  // boost flag for rendering flame
  const boosting = keys.ArrowRight && fuel > 0;
  // move stars for parallax effect
  stars.forEach(s => {
    s.x -= s.speed;
    if (s.x < 0) {
      s.x = width;
      s.y = Math.random() * height;
      s.size = Math.random() * 2 + 1;
      s.speed = Math.random() * 0.5 + 0.2;
    }
  });
    // Ship control
    if (keys.ArrowUp) ship.vy = -4;
    else if (keys.ArrowDown) ship.vy = 4;
    else ship.vy *= 0.9;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.vy));
    if (keys.ArrowRight && fuel > 0) { // boost
      ship.x = Math.min(width - ship.w, ship.x + 6);
      fuel -= dt * 0.02;
    } else {
      ship.x = Math.max(0, ship.x - 1); // auto forward simulation
    }
    // fuel decay
    fuel = Math.max(0, fuel - dt * 0.005);

    // Spawn obstacles/fuel
    if (Math.random() < 0.02) spawnObstacle();
    if (Math.random() < 0.005) spawnFuel();

    // Move obstacles and check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) { obstacles.splice(i, 1); score++; }
      // collision
      if (o.x < ship.x + ship.w && o.x + o.w > ship.x && o.y < ship.y + ship.h && o.y + o.h > ship.y) {
        playCollision();
        endGame();
        return;
      }
    }
    // Move fuels and collect
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      if (f.x + f.r < 0) fuels.splice(i, 1);
      else if (Math.hypot(f.x - ship.x, f.y - ship.y) < f.r + Math.max(ship.w, ship.h) / 2) {
        fuel = Math.min(100, fuel + 20);
        score += 5;
        fuels.splice(i, 1);
        playCollect();
      }
    }
  }

  function draw() {
    // starfield background with gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // draw nebulae (soft glows)
    nebulae.forEach(n => {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw moving stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // boost flame
    if (isBoosting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h / 2);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 4);
      ctx.lineTo(ship.x - 10, ship.y + (3 * ship.h) / 4);
      ctx.closePath();
      ctx.fill();
    }
    // obstacles as asteroids (grey with slight gradient)
    obstacles.forEach(o => {
      const radius = Math.min(o.w, o.h) / 2;
      const grad = ctx.createRadialGradient(o.x + radius, o.y + radius, radius * 0.2, o.x + radius, o.y + radius, radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + radius, o.y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cells with glow effect
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#008');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(fuel)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 16; // roughly normalize to 60fps
    lastTime = timestamp;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  let running = true;
  function endGame() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', width / 2 - 60, height / 2);
    ctx.fillText(`Score: ${score}`, width / 2 - 50, height / 2 + 30);
  }

  requestAnimationFrame(loop);
})();
