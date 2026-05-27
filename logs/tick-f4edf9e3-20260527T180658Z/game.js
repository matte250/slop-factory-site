// Simple Neon Grid Runner – targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a short beep
  const beep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.1);
    }, dur);
  };
  // Ambient background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.value = 60; // low rumble
  bgGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  bgGain.gain.exponentialRampToValueAtTime(0.03, audioCtx.currentTime + 0.5);
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgOsc.start();
  const W = canvas.width = 400;
  const H = canvas.height = 600;

  const LANE_COUNT = 3;
  const LANE_WIDTH = W / LANE_COUNT;
  const PLAYER_RADIUS = 8;
  const PLAYER_Y = H - 50; // fixed vertical position

  let playerLane = 1; // 0‑left,1‑mid,2‑right
  let obstacles = [];
  let stars = [];
  let score = 0;
  let gameOver = false;
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 800; // ms
  // generate background stars
  const spawnStar = () => {
    stars.push({ x: Math.random() * W, y: -2, size: Math.random() * 2 + 1, speed: Math.random() * 0.05 + 0.02 });
  };

  // Input handling
  const move = dir => {
    // resume audio context on first user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playerLane = Math.max(0, Math.min(LANE_COUNT - 1, playerLane + dir));
    // sound for lane change
    beep(440, 80);
  };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === ' ') e.preventDefault(); // prevent scroll
  });

  // Simple touch – taps on left/right half of canvas
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    move(x < W / 2 ? -1 : 1);
  });

  const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const spd = Math.random() * 0.12 + 0.15; // varied speed
    obstacles.push({ lane, y: -20, size: 20, speed: spd });
  };
  // spawn a background star
  const spawnStar = () => {
    stars.push({ x: Math.random() * W, y: -2, size: Math.random() * 2 + 1, speed: Math.random() * 0.05 + 0.02 });
  };

  const update = dt => {
    if (gameOver) return;
    // spawn obstacles and stars
    const now = performance.now();
    if (now - lastSpawn > SPAWN_INTERVAL) { spawnObstacle(); lastSpawn = now; }
    // occasional star spawn
    if (Math.random() < 0.05) spawnStar();
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += dt * o.speed; // use obstacle speed
      // collision (simple circle‑square check)      
      const playerX = playerLane * LANE_WIDTH + LANE_WIDTH / 2;
      if (o.lane === playerLane && Math.abs(o.y - PLAYER_Y) < PLAYER_RADIUS + o.size / 2) {
        // collision sound
        beep(150, 200);
        gameOver = true;
        break;
      }
      // remove off‑screen
      if (o.y - o.size > H) { obstacles.splice(i, 1); score++; }
    }
    // move stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += dt * s.speed;
      if (s.y > H) stars.splice(i, 1);
    }
  };

  const draw = () => {
    // background with vertical neon gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // neon grid lines with glow
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 4;
    for (let i = 0; i <= LANE_COUNT; i++) {
      const x = i * LANE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // player dot with neon glow
    const px = playerLane * LANE_WIDTH + LANE_WIDTH / 2;
    const playerGrad = ctx.createRadialGradient(px, PLAYER_Y, PLAYER_RADIUS * 0.2, px, PLAYER_Y, PLAYER_RADIUS);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(px, PLAYER_Y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // obstacles (neon spikes)
    obstacles.forEach(o => {
      const x = o.lane * LANE_WIDTH + LANE_WIDTH / 2;
      ctx.save();
      ctx.translate(x, o.y);
      ctx.fillStyle = '#f0f';
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -o.size/2);
      ctx.lineTo(o.size/2, o.size/2);
      ctx.lineTo(-o.size/2, o.size/2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '36px monospace';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
