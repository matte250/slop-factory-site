// Meteor Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  document.addEventListener('keydown', resumeAudio);
  document.addEventListener('click', resumeAudio);

  // Stars background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5
    });
  }

  // Ship
  const ship = { w: 40, h: 20, x: W / 2, y: H - 30, speed: 5, dir: 0 };
  const keys = { ArrowLeft: false, ArrowRight: false };
  document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Meteors
  const meteors = [];
  let spawnTimer = 0;
  let speedInc = 0.001; // speed increase per frame
  const baseSpeed = 2;

  // Timer (seconds)
  let timeLeft = 30;
  let lastTime = performance.now();

  let gameOver = false;
  // Ship move sound cooldown (ms)
  let moveSoundCooldown = 0;

  function spawnMeteor() {
    const radius = 15 + Math.random() * 10;
    meteors.push({ x: Math.random() * (W - radius * 2) + radius, y: -radius, r: radius, v: baseSpeed + Math.random() * 2 });
    // Play spawn sound
    playTone(300, 0.07);
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft) ship.dir = -1;
    else if (keys.ArrowRight) ship.dir = 1;
    else ship.dir = 0;
    ship.x += ship.dir * ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(W - ship.w / 2, ship.x));
    // Ship move sound with cooldown
    if (moveSoundCooldown > 0) {
      moveSoundCooldown -= dt;
    } else if (ship.dir !== 0) {
      playTone(400, 0.08);
      moveSoundCooldown = 150; // ms
    }

    // meteors
    meteors.forEach(m => { m.y += (m.v + speedInc * dt) * dt; });
    // remove off‑screen
    for (let i = meteors.length - 1; i >= 0; i--) if (meteors[i].y - meteors[i].r > H) meteors.splice(i, 1);

    // collision detection (circle‑rect)
    for (const m of meteors) {
      const cx = m.x, cy = m.y, r = m.r;
      const rx = ship.x - ship.w / 2, ry = ship.y - ship.h / 2, rw = ship.w, rh = ship.h;
      const closestX = Math.max(rx, Math.min(cx, rx + rw));
      const closestY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - closestX, dy = cy - closestY;
      if (dx * dx + dy * dy < r * r) { playTone(100, 0.2); gameOver = true; break; }
    }

    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) { playTone(150, 0.3); gameOver = true; }

    // spawn control
    spawnTimer += dt;
    if (spawnTimer > 1000) { spawnMeteor(); spawnTimer = 0; }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x - ship.w / 2, ship.y - ship.h / 2, ship.x + ship.w / 2, ship.y + ship.h / 2);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // Meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
      grad.addColorStop(0, '#ff6');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Timer text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Time: ' + Math.max(0, timeLeft.toFixed(1)), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
