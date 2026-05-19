// Simple Meteor Miner game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game constants
  const STAR_COUNT = 80;
  const PLAYER_SIZE = 30;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const PLAYER_SPEED = 4;
  const NUGGET_SIZE = 12;
  const METEOR_SIZE = 24;
  const SPAWN_INTERVAL = 1000; // ms
  const GAME_TIME = 60; // seconds

  // State
  let player = { x: width / 2, y: height - 50, w: PLAYER_SIZE, h: PLAYER_SIZE };
  let nuggets = [];
  let meteors = [];
  let stars = [];
  let score = 0;
  let elapsed = 0;
  let lastSpawn = 0;
  let gameOver = false;

  // Init stars
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => { audioCtx.resume(); keys[e.key] = true; });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Helper functions
  const rectIntersect = (a, b) => !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  const spawnNugget = () => {
    const x = Math.random() * (width - NUGGET_SIZE);
    nuggets.push({ x, y: -NUGGET_SIZE, w: NUGGET_SIZE, h: NUGGET_SIZE, vy: 2 + Math.random() * 2 });
  };
  const spawnMeteor = () => {
    const x = Math.random() * (width - METEOR_SIZE);
    meteors.push({ x, y: -METEOR_SIZE, w: METEOR_SIZE, h: METEOR_SIZE, vy: 3 + Math.random() * 2 });
  };

  const update = (dt) => {
    if (gameOver) return;
    // Move player
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED;
    if (keys.ArrowRight) player.x += PLAYER_SPEED;
    if (keys.ArrowUp) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown) player.y += PLAYER_SPEED;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(width - player.w, player.x));
    player.y = Math.max(0, Math.min(height - player.h, player.y));
    // Spawn objects
    lastSpawn += dt;
    if (lastSpawn > SPAWN_INTERVAL) {
      lastSpawn = 0;
      // 70% nugget, 30% meteor
      if (Math.random() < 0.7) spawnNugget(); else spawnMeteor();
    }
    // Update nuggets
    for (let i = nuggets.length - 1; i >= 0; i--) {
      const n = nuggets[i];
      n.y += n.vy;
      if (n.y > height) { nuggets.splice(i, 1); continue; }
      if (rectIntersect(player, n)) { score++; playTone(800, 0.08); nuggets.splice(i, 1); }
    }
    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.vy;
      if (m.y > height) { meteors.splice(i, 1); continue; }
      if (rectIntersect(player, m)) { playTone(200, 0.3); gameOver = true; }
    }
    // Timer
    elapsed += dt / 1000;
    if (elapsed >= GAME_TIME) gameOver = true;
  };

const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Player (triangle ship)
    ctx.fillStyle = '#4287f5';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
    // Nuggets (glowing circles)
    const nugGradient = ctx.createRadialGradient(0,0,0,0,0, NUGGET_SIZE/2);
    nugGradient.addColorStop(0,'#fff700');
    nugGradient.addColorStop(1,'#b8860b');
    ctx.fillStyle = nugGradient;
    nuggets.forEach(n => {
      ctx.save();
      ctx.translate(n.x + n.w/2, n.y + n.h/2);
      ctx.beginPath();
      ctx.arc(0,0,NUGGET_SIZE/2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    // Meteors (craters)
    const meteorGradient = ctx.createRadialGradient(0,0,0,0,0, METEOR_SIZE/2);
    meteorGradient.addColorStop(0,'#555');
    meteorGradient.addColorStop(1,'#111');
    ctx.fillStyle = meteorGradient;
    meteors.forEach(m => {
      ctx.save();
      ctx.translate(m.x + m.w/2, m.y + m.h/2);
      ctx.beginPath();
      ctx.arc(0,0,METEOR_SIZE/2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, (GAME_TIME - Math.floor(elapsed))).toFixed(0)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 30);
    }
  };


  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
