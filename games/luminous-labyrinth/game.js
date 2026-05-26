// Luminous Labyrinth – minimal implementation
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  const center = { x: width / 2, y: height / 2 };

  // background gradient will be drawn each frame
  const bgGradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, Math.max(width, height) / 2);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#000');

  // trail for the glowing orb
  const trail = [];
  const trailLength = 12;

  // time tracking for pulsating crystals
  let currentTime = 0;

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure audio context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  // player (glowing orb)
  const player = { x: center.x, y: center.y, r: 8, speed: 2, vx: 0, vy: 0, color: '#0ff' };

  // generated crystals
  const crystals = [];
  const crystalCount = 5;
  for (let i = 0; i < crystalCount; i++) {
    crystals.push({ x: Math.random() * width, y: Math.random() * height, r: 5, collected: false, color: '#ff0' });
  }

  // rotating walls – each wall is a line segment defined in polar coords
  const wallCount = 6;
  const walls = [];
  for (let i = 0; i < wallCount; i++) {
    const angle = (i / wallCount) * Math.PI * 2;
    const len = Math.min(width, height) * 0.4;
    walls.push({ angle, len, thickness: 4, color: '#fff' });
  }
  let rotation = 0;

  // timer
  let timeLeft = 60; // seconds
  const timerEl = document.createElement('div');
  timerEl.style.position = 'absolute';
  timerEl.style.top = '10px';
  timerEl.style.left = '10px';
  timerEl.style.color = '#fff';
  document.body.appendChild(timerEl);

  // input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // move player
    player.vx = player.vy = 0;
    if (keys.ArrowUp) player.vy = -player.speed;
    if (keys.ArrowDown) player.vy = player.speed;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;
    player.x += player.vx;
    player.y += player.vy;
    // keep inside bounds
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));

    // push position to trail
    trail.push({ x: player.x, y: player.y, r: player.r });
    if (trail.length > trailLength) trail.shift();

    // rotate walls
    rotation += 0.5 * dt; // rad per ms
    // collision with walls (approximate as distance to line segment)
    for (const w of walls) {
      const a = rotation + w.angle;
      const x1 = center.x + Math.cos(a) * 20;
      const y1 = center.y + Math.sin(a) * 20;
      const x2 = center.x + Math.cos(a) * (20 + w.len);
      const y2 = center.y + Math.sin(a) * (20 + w.len);
      const dist = pointLineDist(player.x, player.y, x1, y1, x2, y2);
      if (dist < player.r + w.thickness / 2) {
        gameOver();
        return;
      }
    }
    // collect crystals
    for (const c of crystals) {
      if (!c.collected && distance(player.x, player.y, c.x, c.y) < player.r + c.r) {
        c.collected = true;
        // play collection sound
        playTone(800, 150);
        // add new crystal
        const nx = Math.random() * width;
        const ny = Math.random() * height;
        crystals.push({ x: nx, y: ny, r: 5, collected: false, color: '#ff0' });
      }
    }
    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) gameOver();
    timerEl.textContent = `Time: ${Math.ceil(timeLeft)}`;

    // advance time for pulsating effect
    currentTime += dt;
  }

  function draw() {
    // draw background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // draw trailing effect for player
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const age = trail.length - i;
      const alpha = (age / trail.length) * 0.5;
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * (0.6 + 0.4 * age / trail.length), 0, Math.PI * 2);
      ctx.fill();
    }

    // draw rotating walls with glow
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 6;
    for (const w of walls) {
      const a = rotation + w.angle;
      const x1 = center.x + Math.cos(a) * 20;
      const y1 = center.y + Math.sin(a) * 20;
      const x2 = center.x + Math.cos(a) * (20 + w.len);
      const y2 = center.y + Math.sin(a) * (20 + w.len);
      ctx.strokeStyle = w.color;
      ctx.lineWidth = w.thickness;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset

    // draw crystals with pulsating effect
    for (const c of crystals) if (!c.collected) {
      const pulse = 0.5 + 0.5 * Math.sin(currentTime / 200);
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw player with glow
    ctx.shadowColor = 'rgba(0,255,255,0.6)';
    ctx.shadowBlur = 12;
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#008');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function loop(timestamp) {
    if (!last) last = timestamp;
    const dt = timestamp - last;
    last = timestamp;
    update(dt);
    draw();
    if (!ended) requestAnimationFrame(loop);
  }

  function distance(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.hypot(dx, dy);
  }

  function pointLineDist(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx; const dy = py - yy;
    return Math.hypot(dx, dy);
  }

  let last = null;
  let ended = false;
  function gameOver() {
    ended = true;
    timerEl.textContent = 'Game Over';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  requestAnimationFrame(loop);
})();
