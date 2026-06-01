// Simple endless runner for canvas with id="game"
// Player is a neon triangle; obstacles are red squares; orbs are blue circles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 600;
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Resume audio context on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once:true});
  canvas.addEventListener('click', resumeAudio, {once:true});

  // Game state
  const player = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 40,
    speed: 5,
    color: '#0ff'
  };
  const obstacles = [];
  const orbs = [];
  const stars = [];
  let frames = 0;
  let score = 0;
  let running = true;
  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }
  function spawnOrb() {
    const r = 8;
    const x = Math.random() * (width - r * 2) + r;
    orbs.push({ x, y: -r, r, speed: 2 });
  }

  function update() {
    // Move stars (twinkling background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // Move player
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Keep inside bounds
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i, 1);
    }
    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.y += orb.speed;
      if (orb.y - orb.r > height) orbs.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
        running = false; // game over
        playSound(150, 0.4); // low tone on crash
      }
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      const dx = (player.x + player.w / 2) - orb.x;
      const dy = (player.y + player.h / 2) - orb.y;
      if (Math.hypot(dx, dy) < orb.r + Math.min(player.w, player.h) / 2) {
        score += 10;
        playSound(440, 0.1); // collect sound
        orbs.splice(i, 1);
      }
    }

    // Background ambience
    if (frames % 200 === 0) playSound(80, 0.05);

    // Spawn new obstacles/orbs periodically
    if (frames % 90 === 0) spawnObstacle();
    if (frames % 150 === 0) spawnOrb();
    frames++;
  }

  function draw() {
    // background gradient (dark to purple)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#111');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw player (neon triangle) with glow
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Reset shadow for other elements
    ctx.shadowBlur = 0;

    // Obstacles with neon glow
    ctx.fillStyle = '#f44';
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 8;
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.shadowBlur = 0;

    // Orbs with glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    for (const orb of orbs) {
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#0ff';
    for (const orb of orbs) {
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, width / 2, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
