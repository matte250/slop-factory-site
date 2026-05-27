// Neon Runner – minimal endless runner
// Canvas with id "game". No external libs.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Audio setup
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playTone(freq, dur) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollect() { playTone(800, 0.1); }
  function playHit() { playTone(200, 0.3); }

  // Game state
  const player = { x: width / 2, y: height - 30, w: 20, h: 20, lane: 0 };
  const laneCount = 3; // left, center, right
  const laneWidth = width / laneCount;
  const speed = 2; // forward scroll speed (pixels per frame)
  const obstacles = [];
  const orbs = [];
  let charge = 100; // energy percent
  let frame = 0;
  let running = true;

  // Input – arrow keys or A/D
  document.addEventListener('keydown', e => {
    if (!running) return;
    initAudio(); // ensure AudioContext is resumed on user interaction
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      player.lane = Math.max(0, player.lane - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      player.lane = Math.min(laneCount - 1, player.lane + 1);
    }
    player.x = player.lane * laneWidth + laneWidth / 2;
  });

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * laneCount);
    const type = Math.random() < 0.7 ? 'spike' : 'gap'; // gap is empty space, handled by skipping draw
    const size = laneWidth * 0.6;
    obstacles.push({ lane, y: -size, size, type });
  }

  function spawnOrb() {
    const lane = Math.floor(Math.random() * laneCount);
    const radius = 8;
    orbs.push({ lane, y: -radius * 2, radius });
  }

  function update() {
    if (!running) return;
    frame++;
    // decrease charge over time
    charge -= 0.05;
    if (charge <= 0) endGame();

    // spawn obstacles/orbs periodically
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 200 === 0) spawnOrb();

    // move obstacles/orbs down (simulating forward motion)
    obstacles.forEach(o => o.y += speed);
    orbs.forEach(o => o.y += speed);

    // collision detection
    obstacles.forEach(o => {
      if (o.type === 'spike' && o.lane === player.lane) {
        if (o.y + o.size > player.y && o.y < player.y + player.h) {
          playHit();
          endGame();
        }
      }
    });
    orbs.forEach((orb, i) => {
      if (orb.lane === player.lane) {
        if (orb.y + orb.radius > player.y && orb.y - orb.radius < player.y + player.h) {
          charge = Math.min(100, charge + 15);
          playCollect();
          orbs.splice(i, 1);
        }
      }
    });

    // cleanup off‑screen objects
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();
    while (orbs.length && orbs[0].y > height) orbs.shift();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient night sky
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // subtle stars
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // draw player neon line with glow
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x, player.y - player.h);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // draw obstacles with neon glow
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        const x = o.lane * laneWidth + laneWidth / 2;
        // gradient for spike
        const grad = ctx.createLinearGradient(x - o.size / 2, o.y, x + o.size / 2, o.y + o.size);
        grad.addColorStop(0, '#ff5555');
        grad.addColorStop(1, '#aa0000');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ff5555';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x - o.size / 2, o.y + o.size);
        ctx.lineTo(x, o.y);
        ctx.lineTo(x + o.size / 2, o.y + o.size);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }
    });
    // draw energy orbs with pulsating glow
    orbs.forEach(o => {
      const x = o.lane * laneWidth + laneWidth / 2;
      const grad = ctx.createRadialGradient(x, o.y, 0, x, o.y, o.radius);
      grad.addColorStop(0, '#ffff80');
      grad.addColorStop(1, '#ff8000');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff8000';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // draw charge bar with neon effect
    const barW = width * 0.3;
    const chargeW = barW * (charge / 100);
    // gradient fill
    const barGrad = ctx.createLinearGradient(10, 0, 10 + barW, 0);
    barGrad.addColorStop(0, '#0f0');
    barGrad.addColorStop(1, '#080');
    ctx.fillStyle = barGrad;
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 6;
    ctx.fillRect(10, 10, chargeW, 8);
    ctx.shadowBlur = 0;
    // border
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, barW, 8);
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  // start loop after assets ready (none)
  loop();
})();
