// Neon Grid Escape – concise implementation targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.offsetWidth);
  const h = (canvas.height = canvas.offsetHeight);
  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 120;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  // ----- Player -----
  const player = {
    x: w / 2,
    y: h - 60,
    r: 6,
    angle: -Math.PI / 2,
    speed: 0,
    thrust: 0,
    maxSpeed: 4,
    turnSpeed: 0.07,
  };

  // ----- Obstacles -----
  const obstacles = [];
  // player trail for neon effect
  const trail = [];
  let obstacleTimer = 0;
  const obstacleInterval = 1500; // ms, will accelerate over time

  // ----- Game state -----
  let lastTime = 0;
  let score = 0;
  let running = true;
  // stars background – generate once
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // ----- Input handling -----
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, a: false, d: false, w: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function update(dt) {
    // player rotation
    if (keys.ArrowLeft || keys.a) player.angle -= player.turnSpeed;
    if (keys.ArrowRight || keys.d) player.angle += player.turnSpeed;
    // thrust
      if (keys.ArrowUp || keys.w) { player.thrust = 0.1; startThrustSound(); } else { player.thrust = 0; stopThrustSound(); }
    // velocity update
    player.speed = Math.min(player.maxSpeed, player.speed + player.thrust);
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
    // wrap around edges
    if (player.x < 0) player.x += w;
    if (player.x > w) player.x -= w;
    if (player.y < 0) player.y += h;
    if (player.y > h) player.y -= h;

    // record trail point for neon tail
    trail.push({ x: player.x, y: player.y, age: 0 });
    // age and prune trail
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].age += dt;
      if (trail[i].age > 800) trail.splice(i, 1); // fade after 0.8s
    }

    // move stars background
    for (const s of stars) {
      s.y += 0.3 * dt / 16; // slow drift
      if (s.y > h) {
        s.y = 0;
        s.x = Math.random() * w;
      }
    }

    // obstacles spawn
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      obstacleTimer = 0;
      const size = 20 + Math.random() * 30;
      const x = Math.random() * w;
      const y = -size;
      const speed = 1 + Math.random() * 1.5 + score / 20000; // speed up over time
      obstacles.push({ x, y, w: size, h: size, speed });
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.h > h) obstacles.splice(i, 1);
      // collision with player (circle-rect)
      const dx = Math.abs(player.x - (o.x + o.w / 2));
      const dy = Math.abs(player.y - (o.y + o.h / 2));
      if (dx > o.w / 2 + player.r || dy > o.h / 2 + player.r) continue;
        if (dx <= o.w / 2 || dy <= o.h / 2 || (dx - o.w / 2) ** 2 + (dy - o.h / 2) ** 2 <= player.r ** 2) {
          playCollisionSound();
          running = false;
        }
    }

    // score – survival time
    score += dt;
  }

  function draw() {
    // neon background grid with glow
    // draw dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    // draw stars background
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    // set glow for grid lines
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 0.5;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // reset shadow for other drawings
    ctx.shadowBlur = 0;
    // draw trail (neon tail)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = 1 - t.age / 800;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(t.x, t.y, player.r * 0.6, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
    // player with neon glow
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    // draw glow using shadow
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, 2 * Math.PI);
    ctx.fill();
    // reset shadow for other drawings
    ctx.shadowBlur = 0;
    // thrust particles (simple flare)
    if (player.thrust) {
      ctx.strokeStyle = '#f80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-player.r, 0);
      ctx.lineTo(-player.r - 12, 0);
      ctx.stroke();
    }
    ctx.restore();
    // obstacles with neon outline
    for (const o of obstacles) {
      ctx.save();
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#f0f';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.restore();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);
    // game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', w / 2, h / 2);
      ctx.font = '16px monospace';
      ctx.fillText('Final Score: ' + Math.floor(score / 1000), w / 2, h / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
