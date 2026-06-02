// Simple canvas dodge game – targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;

  // Pre‑generated starfield for background
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // Audio setup using Web Audio API and fallback HTMLAudioElement
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const hitSound = () => playBeep(150, 0.2);
  const spawnSound = () => playBeep(300, 0.05);
  const bgMusic = new Audio('data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play().catch(() => {}); // ignore if user gesture needed

  const player = { x: canvas.width / 2, y: canvas.height / 2, r: 10, speed: 300 };
  const keys = {};
  const enemies = [];
  let spawnTimer = 0;
  let elapsed = 0;
  let gameOver = false;

  // Input handling
  addEventListener('keydown', e => (keys[e.key] = true));
  addEventListener('keyup', e => (keys[e.key] = false));

  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  const circle = (x, y, r, col) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); };

  const collide = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  };

  const spawnEnemy = () => {
    // spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * canvas.height; }
    else if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = 0; }
    else { x = Math.random() * canvas.width; y = canvas.height; }
    enemies.push({ x, y, r: 8, speed: 120, phase: Math.random() * Math.PI * 2 });
    spawnSound();
  };

  const update = dt => {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) player.y -= player.speed * dt;
    if (keys.ArrowDown) player.y += player.speed * dt;
    if (keys.ArrowLeft) player.x -= player.speed * dt;
    if (keys.ArrowRight) player.x += player.speed * dt;
    // keep inside canvas
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    // spawn enemies
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = 1; // one per second
    }

    // update enemies
    for (const e of enemies) {
      // direction toward player
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const angle = Math.atan2(dy, dx);
      // sine offset perpendicular to direction
      const perp = angle + Math.PI / 2;
      const offset = Math.sin(elapsed * 3 + e.phase) * 30; // wave amplitude
      e.x += Math.cos(angle) * e.speed * dt + Math.cos(perp) * offset * dt;
      e.y += Math.sin(angle) * e.speed * dt + Math.sin(perp) * offset * dt;
      // collision
      if (collide(e, player)) {
        hitSound();
        gameOver = true;
      }
    }
    // remove off‑screen enemies (optional)
    enemies.forEach((e, i) => {
      if (e.x < -50 || e.x > canvas.width + 50 || e.y < -50 || e.y > canvas.height + 50) {
        enemies.splice(i, 1);
      }
    });
    elapsed += dt;
  };

  const draw = () => {
    // clear and draw starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // player (triangle with gradient)
    const grad = ctx.createLinearGradient(0, player.y - player.r, 0, player.y + player.r);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#0033aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.lineTo(player.x + player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // enemies (glowing circles)
    for (const e of enemies) {
      const eg = ctx.createRadialGradient(e.x, e.y, e.r * 0.3, e.x, e.y, e.r);
      eg.addColorStop(0, 'rgba(255,69,0,0.9)');
      eg.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(elapsed)}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = now => {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
