// Nebula Dodge – concise canvas game
// Assumes a <canvas id="game"></canvas> element in the page.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  // ----- Game State -----
  const ship = { x: canvas.width / 2, y: canvas.height - 50, r: 12, speed: 4 };
  const nebulae = [];
  const stars = [];
  let score = 0;
  let running = true;

  // ----- Audio Setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let musicNode = null;
  function startMusic() {
    if (musicNode) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 30; // low rumble
    gain.gain.value = 0.02;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    musicNode = osc;
  }
  function playBoost() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 500;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  function playCrash() {
    const bufferSize = audioCtx.sampleRate * 0.3;
    const noise = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noise.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noise;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    noiseNode.connect(gain).connect(audioCtx.destination);
    noiseNode.start();
    noiseNode.stop(audioCtx.currentTime + 0.3);
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    if (!audioCtx.state || audioCtx.state === 'suspended') audioCtx.resume();
    startMusic();
    if (e.key === 'ArrowUp' || e.key === 'w') playBoost();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function addNebula() {
    const size = rand(20, 60);
    nebulae.push({ x: rand(0, canvas.width), y: -size, r: size / 2, vy: rand(1, 3) });
  }
  function addStar() {
    stars.push({ x: rand(0, canvas.width), y: rand(0, canvas.height), s: rand(0.5, 1.5) });
  }
  for (let i = 0; i < 100; i++) addStar();

  // ----- Main Loop -----
  function update(dt) {
    // ship movement
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.y -= ship.speed * 1.5; // boost
    if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed * 0.5;
    // keep inside canvas
    ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y));

    // nebula spawn
    if (Math.random() < 0.02) addNebula();
    // update nebulae
    for (let i = nebulae.length - 1; i >= 0; i--) {
      const n = nebulae[i];
      n.y += n.vy;
      if (n.y - n.r > canvas.height) nebulae.splice(i, 1);
    }
    // update stars (simple scroll)
    for (const s of stars) s.y += 0.5;
    for (let i = stars.length - 1; i >= 0; i--) if (stars[i].y > canvas.height) stars[i].y = 0;

    // collision detection (circle vs circle)
    for (const n of nebulae) {
      const dx = ship.x - n.x;
      const dy = ship.y - n.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.r + n.r) { running = false; playCrash(); if (musicNode) { musicNode.stop(); musicNode = null; } break; }
    }
    if (running) score += dt * 0.01;
  }

  function draw() {
    // draw dark space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000040');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars with twinkle
    for (const s of stars) {
      const bright = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${bright})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    // nebulae – soft glowing clouds with radial gradient
    for (const n of nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, 'rgba(200,0,255,0.6)');
      grad.addColorStop(1, 'rgba(80,0,120,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship (white triangle)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
