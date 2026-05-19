// Minimal endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(frequency = 200, duration = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Game state
  let running = true;
  let lastTime = 0;
  let elapsed = 0; // ms since start
  let score = 0;
  const TIMER = 60_000; // 60 s
  // Input
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
  // Player ship
  const ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 200 };
  // Stars background with twinkling and gradient sky
  const stars = [];
  for (let i = 0; i < 100; i++) stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 + 1, speed: 30 + Math.random() * 40 });
  // Obstacles (asteroids/lasers)
  const obstacles = [];
  function spawnObstacle() {
    const w = 20 + Math.random() * 30;
    obstacles.push({ x: Math.random() * (width - w), y: -w, w, h: w, speed: 100 + Math.random() * 100 });
  }
  let spawnTimer = 0;
  // Core loop
  function update(dt) {
    if (!running) return;
    elapsed += dt;
    // timer end
    if (elapsed >= TIMER) { running = false; return; }
    // player movement
    if (keys.ArrowLeft) ship.x -= ship.speed * dt / 1000;
    if (keys.ArrowRight) ship.x += ship.speed * dt / 1000;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    // stars scroll down (simulating upward ship movement)
    for (const s of stars) {
      s.y += s.speed * dt / 1000;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }
    // spawn obstacles every ~0.8‑1.2 s
    spawnTimer += dt;
    if (spawnTimer > 800 + Math.random() * 400) {
        spawnObstacle();
        playBeep(300, 0.1); // obstacle spawn sound
        spawnTimer = 0;
      }
    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed * dt / 1000;
      // collision detection (AABB)
      if (o.x < ship.x + ship.w && o.x + o.w > ship.x && o.y < ship.y + ship.h && o.y + o.h > ship.y) {
        // collision sound
        playBeep(100, 0.3);
        running = false;
        break;
      }
      if (o.y > height) obstacles.splice(i, 1);
    }
    // score = survived seconds * 10 (arbitrary)
    score = Math.floor((elapsed / 1000) * 10);
  }
  function draw() {
  // draw gradient sky background
    ctx.clearRect(0, 0, width, height);
    // gradient sky background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#001d3d'); // deep night blue
    skyGrad.addColorStop(1, '#000000');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // stars with twinkling (vary opacity)
    for (const s of stars) {
      const alpha = 0.5 + Math.random() * 0.5; // 0.5-1.0
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    // ship (rocket with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#4caf50'); // lighter
    shipGrad.addColorStop(1, '#1b5e20'); // darker
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h); // bottom left
    ctx.lineTo(ship.x + ship.w / 2, ship.y); // tip
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h); // bottom right
    ctx.lineTo(ship.x + ship.w * 0.75, ship.y + ship.h); // right fin base
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h * 0.6); // fin tip
    ctx.lineTo(ship.x + ship.w * 0.25, ship.y + ship.h); // left fin base
    ctx.closePath();
    ctx.fill();
    // obstacles (asteroids as gradient circles)
    for (const o of obstacles) {
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w*0.1, o.x + o.w/2, o.y + o.h/2, o.w/2);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    const remaining = Math.max(0, Math.ceil((TIMER - elapsed) / 1000));
    ctx.fillText(`Time: ${remaining}s`, width - 100, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 20);
    }
  }
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
    else {
      // allow restart on click
      canvas.addEventListener('click', () => location.reload(), { once: true });
    }
  }
  requestAnimationFrame(loop);
})();
