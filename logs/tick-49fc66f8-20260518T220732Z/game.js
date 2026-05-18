// Simple Orbital Dodge game
(() => {
  const canvas = document.getElementById('game');
  // background stars with twinkle
  const starCount = 120;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      baseR: Math.random() * 1.5 + 0.5,
      r: 0,
      a: Math.random(), // alpha
      da: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1), // flicker speed
    });
  }
  // audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // start sound on first interaction
  let audioStarted = false;
  function ensureAudio() {
    if (!audioStarted && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioStarted = true;
  }
  function playTone(freq, dur) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }
  let collisionPlayed = false; // prevent repeat game‑over sound
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth);
  const h = (canvas.height = canvas.clientHeight);
  const center = { x: w / 2, y: h / 2 };

  const planetR = 30;
  const shipR = 8;
  const orbitR = Math.min(w, h) / 3;
  let shipAngle = 0;
  const shipSpeed = 0.04; // rad per frame when key held
  let left = false,
    right = false;

  const asteroids = [];
  const asteroidR = 12;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  const keyDown = (e) => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
  };
  const keyUp = (e) => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  function spawnAsteroid() {
    // choose random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * h; }
    else if (side === 1) { x = w; y = Math.random() * h; }
    else if (side === 2) { x = Math.random() * w; y = 0; }
    else { x = Math.random() * w; y = h; }
    // direction toward center
    const dx = center.x - x;
    const dy = center.y - y;
    const mag = Math.hypot(dx, dy);
    const speed = 1.5;
    const vx = (dx / mag) * speed;
    const vy = (dy / mag) * speed;
    asteroids.push({ x, y, vx, vy, r: asteroidR });
    // sound for spawn
    playTone(200, 0.08);
  }

  function update(dt) {
    if (left) shipAngle -= shipSpeed;
    if (right) shipAngle += shipSpeed;
    // update stars (twinkle)
    for (let s of stars) {
      s.r = s.baseR * (0.5 + 0.5 * s.a);
      s.a += s.da;
      if (s.a <= 0 || s.a >= 1) s.da = -s.da; // reverse direction
    }
    // update asteroids
    for (let a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }
    // collision check
    const shipX = center.x + Math.cos(shipAngle) * orbitR;
    const shipY = center.y + Math.sin(shipAngle) * orbitR;
    for (let a of asteroids) {
      const d = Math.hypot(a.x - shipX, a.y - shipY);
      if (d < a.r + shipR) {
        if (!collisionPlayed) {
          playTone(100, 0.3);
          collisionPlayed = true;
        }
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    // background stars
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with gradient
    const planetGrad = ctx.createRadialGradient(center.x, center.y, planetR * 0.2, center.x, center.y, planetR);
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planetR, 0, Math.PI * 2);
    ctx.fill();
    // orbit path
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center.x, center.y, orbitR, 0, Math.PI * 2);
    ctx.stroke();
    // ship as a triangle with gradient and glow
    ctx.shadowColor = 'rgba(0,255,0,0.6)';
    ctx.shadowBlur = 8;
    const shipX = center.x + Math.cos(shipAngle) * orbitR;
    const shipY = center.y + Math.sin(shipAngle) * orbitR;
    const shipAngleRad = shipAngle;
    const tipX = shipX + Math.cos(shipAngleRad) * shipR * 2;
    const tipY = shipY + Math.sin(shipAngleRad) * shipR * 2;
    const leftX = shipX + Math.cos(shipAngleRad + Math.PI * 0.75) * shipR;
    const leftY = shipY + Math.sin(shipAngleRad + Math.PI * 0.75) * shipR;
    const rightX = shipX + Math.cos(shipAngleRad - Math.PI * 0.75) * shipR;
    const rightY = shipY + Math.sin(shipAngleRad - Math.PI * 0.75) * shipR;
    const shipGrad = ctx.createLinearGradient(leftX, leftY, tipX, tipY);
    shipGrad.addColorStop(0, '#0c0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow
    // asteroids with radial gradient
    for (let a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff7070');
      grad.addColorStop(1, '#660000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const secs = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${secs}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = 1; // constant step for simplicity
      if (timestamp - lastSpawn > spawnInterval) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
