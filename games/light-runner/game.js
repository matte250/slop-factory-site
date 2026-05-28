// Game based on IDEA.md – Light Runner
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const laneCount = 3;
  const laneWidth = () => canvas.width / laneCount;
  const laneX = (lane) => lane * laneWidth() + laneWidth() / 2;

  const orb = {
    lane: 1,
    radius: 12,
    color: '#ff0',
    get x() { return laneX(this.lane); },
    y: canvas.height * 0.8,
    speedY: 0,
  };

  const obstacles = [];
  const shards = [];
  let lastSpawn = 0;
  let lastShard = 0;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * laneCount);
    const w = laneWidth() * 0.8;
    const h = 20;
    obstacles.push({ lane, w, h, y: -h });
  };

  const spawnShard = () => {
    const lane = Math.floor(Math.random() * laneCount);
    const r = 6;
    shards.push({ lane, r, y: -r, collected: false });
  };

  const update = (dt) => {
    if (gameOver) return;
    // move obstacles down
    obstacles.forEach(o => o.y += 200 * dt);
    // move shards down
    shards.forEach(s => s.y += 200 * dt);
    // remove off‑screen obstacles
    obstacles.filter(o => o.y < canvas.height + o.h);
    // collision detection
    obstacles.forEach(o => {
      const ox = laneX(o.lane);
      const ow = o.w;
      const ox0 = ox - ow / 2;
      const ox1 = ox + ow / 2;
      const oy0 = o.y;
      const oy1 = o.y + o.h;
      const dx = Math.abs(orb.x - ox);
      const dy = Math.abs(orb.y - (oy0 + o.h / 2));
      if (dx < orb.radius + ow / 2 && dy < orb.radius + o.h / 2) {
        gameOver = true;
      }
    });
    // shard collection
    shards.forEach(s => {
      if (s.collected) return;
      const dx = Math.abs(orb.x - laneX(s.lane));
      const dy = Math.abs(orb.y - s.y);
      if (dx < orb.radius + s.r && dy < orb.radius + s.r) {
        s.collected = true;
        score += 10;
      }
    });
    // clean up
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].y > canvas.height) obstacles.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      if (shards[i].y > canvas.height || shards[i].collected) shards.splice(i, 1);
    }
    // spawn timing
    const now = performance.now();
    if (now - lastSpawn > 800) { spawnObstacle(); lastSpawn = now; }
    if (now - lastShard > 1500) { spawnShard(); lastShard = now; }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw orb with glow effect
    const orbGrad = ctx.createRadialGradient(
      orb.x, orb.y, orb.radius * 0.2,
      orb.x, orb.y, orb.radius
    );
    orbGrad.addColorStop(0, '#ffffaa');
    orbGrad.addColorStop(1, '#ff8800');
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, 2 * Math.PI);
    ctx.fillStyle = orbGrad;
    ctx.fill();
    // draw obstacles with gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      grad.addColorStop(0, '#ff5555');
      grad.addColorStop(1, '#aa0000');
      const x = laneX(o.lane) - o.w / 2;
      ctx.fillStyle = grad;
      ctx.fillRect(x, o.y, o.w, o.h);
    });
    // draw shards
    ctx.fillStyle = '#0f0';
    shards.forEach(s => {
      if (s.collected) return;
      ctx.beginPath();
      ctx.arc(laneX(s.lane), s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let lastTime = 0;
  const loop = (time) => {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // input – tap/click toggles left/right relative to current lane
  const shift = (dir) => {
    if (gameOver) return;
    orb.lane = Math.max(0, Math.min(laneCount - 1, orb.lane + dir));
  };
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < canvas.width / 2) shift(-1); else shift(1);
  });
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < canvas.width / 2) shift(-1); else shift(1);
  });
})();
