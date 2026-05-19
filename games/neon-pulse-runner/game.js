// Enhanced Neon Pulse Runner with richer graphics
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;
  // generate starfield for neon background
  const starCount = 150;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }
  // sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const laneCount = 3;
  const laneWidth = width / laneCount;
  const player = {
    lane: 1, // 0:left,1:center,2:right
    y: height * 0.8,
    w: laneWidth * 0.2,
    h: laneWidth * 0.2,
    color: '#0ff',
    invincible: false,
    invTimer: 0,
  };

  const obstacles = [];
  const orbs = [];
  let tick = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * laneCount);
    const size = laneWidth * 0.3;
    obstacles.push({ lane, y: -size, size, color: '#f44' });
  }
  function spawnOrb() {
    const lane = Math.floor(Math.random() * laneCount);
    const radius = laneWidth * 0.1;
    orbs.push({ lane, y: -radius, r: radius, color: '#ff0' });
  }

  function update(dt) {
    if (gameOver) return;
    tick += dt;
    // spawn obstacles/orbs periodically
    if (tick > 1000) { // every second
      tick = 0;
      if (Math.random() < 0.7) spawnObstacle();
      if (Math.random() < 0.3) spawnOrb();
    }
    // move obstacles and check collision
    obstacles.forEach(o => {
      o.y += dt * 0.3; // speed
      if (!player.invincible && o.lane === player.lane && o.y + o.size > player.y && o.y < player.y + player.h) {
        gameOver = true;
        // play collision sound
        playTone(200, 300);
      }
    });
    // move orbs and collect
    orbs.forEach((orb, i) => {
      orb.y += dt * 0.3;
      if (orb.lane === player.lane && orb.y + orb.r > player.y && orb.y - orb.r < player.y + player.h) {
        score += 10;
        orbs.splice(i, 1);
      }
    });
    // clean up off‑screen objects
    obstacles.filter(o => o.y < height + o.size);
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();
    while (orbs.length && orbs[0].y > height) orbs.shift();
    // invincibility timer
    if (player.invincible) {
      player.invTimer -= dt;
      if (player.invTimer <= 0) player.invincible = false;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background with vertical gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // starfield background
    stars.forEach(star => {
      ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // player ship (neon triangle with glow)
    const x = player.lane * laneWidth + laneWidth / 2;
    // apply neon glow
    ctx.shadowColor = player.invincible ? '#fff' : player.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = player.invincible ? '#fff' : player.color;
    ctx.beginPath();
    ctx.moveTo(x, player.y);
    ctx.lineTo(x - player.w / 2, player.y + player.h);
    ctx.lineTo(x + player.w / 2, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // reset shadow for other elements
    ctx.shadowBlur = 0;
    // obstacles with neon glow
    obstacles.forEach(o => {
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = o.color;
      const ox = o.lane * laneWidth + (laneWidth - o.size) / 2;
      ctx.fillRect(ox, o.y, o.size, o.size);
    });
    ctx.shadowBlur = 0;
    // orbs with pulse glow
    orbs.forEach(orb => {
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = orb.color;
      const ox = orb.lane * laneWidth + laneWidth / 2;
      ctx.beginPath();
      ctx.arc(ox, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // score
    ctx.fillStyle = '#0f0';
    ctx.font = '24px monospace';
    ctx.fillText('Score: ' + score, 10, 30);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px monospace';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 40);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // input handling – arrow keys or A/D
  let audioStarted = false;
  function ensureAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }
  window.addEventListener('keydown', e => {
    ensureAudio();
    if (gameOver) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      player.lane = Math.max(0, player.lane - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      player.lane = Math.min(laneCount - 1, player.lane + 1);
    } else if (e.key === ' ') {
      // optional power‑up: toggle invincibility for 2 seconds
      player.invincible = true;
      player.invTimer = 2000;
      playTone(800, 200); // power‑up sound
    }
  });
})();
