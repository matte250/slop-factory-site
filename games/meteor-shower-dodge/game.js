// Simple Meteor Shower Dodge game with improved graphics and sounds
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size (adjust via CSS/HTML if needed)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // --- Starfield background ---
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  }));
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      // move star downwards for subtle motion
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
    });
  }

  const player = {
    w: 30,
    h: 30,
    x: canvas.width / 2 - 15,
    y: canvas.height - 40,
    speed: 6,
  };

  const meteors = [];
  let lastSpawn = 0;
  let spawnInterval = 1000; // ms
  let score = 0;
  let gameOver = false;

  const keys = {};
  // --- Sound Setup ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    const radius = 15 + Math.random() * 10;
    meteors.push({
      x: Math.random() * (canvas.width - radius * 2) + radius,
      y: -radius,
      r: radius,
      speed: 2 + Math.random() * 3,
    });
    // sound for new meteor
    playBeep(300, 80);
  }

  function update(dt) {
    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Clamp
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    // ensure audio context is running after first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();

    // Meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // collision with player (triangle approximated as rect)
      if (
        m.x + m.r > player.x &&
        m.x - m.r < player.x + player.w &&
        m.y + m.r > player.y &&
        m.y - m.r < player.y + player.h
      ) {
        gameOver = true;
        // collision sound
        playBeep(600, 150);
      }
      // off screen bottom -> remove and increase score
      if (m.y - m.r > canvas.height) {
        meteors.splice(i, 1);
        score++;
      }
    }

    // spawn new meteors
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = Date.now();
      if (spawnInterval > 300) spawnInterval -= 20;
    }
  }

  function draw() {
    // background with starfield
    drawStars();
    // player ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // meteors with radial gradient glow
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(255,150,0,0.8)');
      grad.addColorStop(1, 'rgba(150,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
