// Simple Meteor Dodge game with enhanced graphics
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur);
  };
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;
  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 + 1 });
  }

  // Ship (triangle)
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };
  const keys = {};
  document.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // Meteors
  const meteors = [];
  const spawnMeteor = () => {
    const size = Math.random() * 30 + 20;
    meteors.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, vy: Math.random() * 2 + 1 });
  };
  let spawnTimer = 0;

  let score = 0;
  let gameOver = false;

  const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // Spawn meteors
    spawnTimer += 1;
    if (spawnTimer > 30) { // roughly every 0.5s at 60fps
      spawnMeteor();
      playTone(200, 0.05);
      spawnTimer = 0;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.vy;
      if (rectsOverlap(ship, m)) { playTone(100, 0.5); gameOver = true; }
      if (m.y > height) { meteors.splice(i, 1); score++; }
    }
  };

  const draw = () => {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.beginPath() || ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2) && ctx.fill());
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.closePath();
    ctx.fill();
    // Meteors (circles with gradient)
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, m.w / 4, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
      grad.addColorStop(0, '#ff8c8c');
      grad.addColorStop(1, '#b00000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
