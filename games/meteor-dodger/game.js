// Meteor Dodger – minimal implementation
// Assumes a <canvas id="game"></canvas> in the page

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  let thrustOsc = null;
  const canvas = document.getElementById('game');
  // set canvas size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const ctx = canvas.getContext('2d');
  // create starfield particles
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  const ship = { x: canvas.width / 2, y: canvas.height / 2, a: 0, vx: 0, vy: 0, r: 12 };
  const shipTrail = [];
  const TRAIL_MAX = 12;
  const meteors = [];
  const fuels = [];
  let lastMeteor = 0,
    lastFuel = 0,
    time = 60,
    score = 0,
    running = true;

  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnMeteor() {
    // spawn at random edge, heading roughly toward center with rotation
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    if (side === 0) { x = 0; y = Math.random()*canvas.height; }
    else if (side === 1) { x = canvas.width; y = Math.random()*canvas.height; }
    else if (side === 2) { x = Math.random()*canvas.width; y = 0; }
    else { x = Math.random()*canvas.width; y = canvas.height; }
    const angle = Math.atan2(canvas.height/2 - y, canvas.width/2 - x);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    // random rotation state
    const rot = Math.random()*Math.PI*2;
    const rotSpeed = (Math.random()-0.5)*0.02; // subtle spin
    meteors.push({ x, y, vx, vy, r: 15 + Math.random()*10, rot, rotSpeed });
  }

  function spawnFuel() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    fuels.push({ x, y, r: 8, collected: false });
  }

  function update(dt) {
    // ship trail
    shipTrail.push({ x: ship.x, y: ship.y, a: ship.a });
    if (shipTrail.length > TRAIL_MAX) shipTrail.shift();
    // ship control
    if (keys['ArrowLeft']) ship.a -= 0.07;
    if (keys['ArrowRight']) ship.a += 0.07;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.a) * 0.1;
      ship.vy += Math.sin(ship.a) * 0.1;
      beep(400, 80); // thrust sound
    }
    ship.x += ship.vx;
    ship.y += ship.vy;
    // screen wrap
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // meteors
    meteors.forEach(m => { m.x += m.vx; m.y += m.vy; m.rot += m.rotSpeed; });
    // remove off‑screen meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (m.x < -50 || m.x > canvas.width + 50 || m.y < -50 || m.y > canvas.height + 50) meteors.splice(i, 1);
      else if (dist(m.x, m.y, ship.x, ship.y) < m.r + ship.r) {
          beep(150, 300); // collision sound
          running = false;
        } // collision
    }

    // fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (dist(f.x, f.y, ship.x, ship.y) < f.r + ship.r) {
          beep(600, 120); // fuel collect sound
        time += 5; // add 5 seconds
        fuels.splice(i, 1);
        score += 10;
      }
    }

    // spawn timers
    if (performance.now() - lastMeteor > 1500 + Math.random() * 1500) { spawnMeteor(); lastMeteor = performance.now(); }
    if (performance.now() - lastFuel > 8000) { spawnFuel(); lastFuel = performance.now(); }

    time -= dt / 1000;
    if (time <= 0) running = false;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // starfield background with moving stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // move star
      s.y += s.speed;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    });
    // ship trail (fading)
    for (let i = 0; i < shipTrail.length; i++) {
      const t = shipTrail[i];
      const alpha = (i + 1) / shipTrail.length * 0.4; // fade out
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.a);
      ctx.fillStyle = `rgba(0,255,0,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.a);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // meteors (rotating rocks)
    ctx.fillStyle = '#a33';
    meteors.forEach(m => {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      ctx.beginPath();
      // draw a simple 5‑point rock shape
      const r = m.r;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const radius = r * (0.6 + Math.random() * 0.4);
        const vx = Math.cos(angle) * radius;
        const vy = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // fuels
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.max(0, time).toFixed(1)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(ts) {
    if (!prev) prev = ts;
    const dt = ts - prev;
    prev = ts;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
  let prev;
  requestAnimationFrame(loop);
})();
