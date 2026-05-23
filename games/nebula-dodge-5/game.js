// Minimal Nebula Dodge game with improved graphics
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // starfield initialization
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.5 + 0.5,
      delta: (Math.random() - 0.5) * 0.03,
    });
  }

  // Player ship
  const player = {
    x: width / 2,
    y: height / 2,
    size: 12,
    speed: 3,
    vx: 0,
    vy: 0,
    angle: 0,
    color: '#0f0',
  };

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction (required by browsers)
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  const asteroids = [];
  const lasers = [];
  const fuels = [];
  const particles = [];
  let score = 0;
  let gameOver = false;
  let frame = 0;

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 10 + Math.random() * 20;
    const speed = 1 + Math.random() * 2;
    // random gray color for depth variation
    const gray = Math.floor(150 + Math.random() * 105);
    const color = `rgb(${gray},${gray},${gray})`;
    if (side === 0) { // top
      x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * speed; vy = speed;
    } else if (side === 1) { // right
      x = width + size; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed;
    } else if (side === 2) { // bottom
      x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * speed; vy = -speed;
    } else { // left
      x = -size; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed;
    }
    asteroids.push({ x, y, vx, vy, size, color });
  }

  function spawnLaser() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const length = 30;
    const speed = 3 + Math.random() * 2;
    if (side === 0) { x = Math.random() * width; y = -10; vx = 0; vy = speed; }
    else if (side === 1) { x = width + 10; y = Math.random() * height; vx = -speed; vy = 0; }
    else if (side === 2) { x = Math.random() * width; y = height + 10; vx = 0; vy = -speed; }
    else { x = -10; y = Math.random() * height; vx = speed; vy = 0; }
    lasers.push({ x, y, vx, vy, length, color: '#f00' });
    playTone(300, 0.1); // laser zap
  }

  function spawnFuel() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    fuels.push({ x, y, radius: 6, color: '#ff0' });
  }

  function update() {
    if (gameOver) return;
    // handle input
    player.vx = player.vy = 0;
    if (keys['ArrowLeft'] || keys['a']) player.vx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.vx = player.speed;
    if (keys['ArrowUp'] || keys['w']) player.vy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.vy = player.speed;
    player.x = Math.max(0, Math.min(width, player.x + player.vx));
    player.y = Math.max(0, Math.min(height, player.y + player.vy));
    // set ship angle based on movement direction
    if (player.vx !== 0 || player.vy !== 0) {
      player.angle = Math.atan2(player.vy, player.vx);
    }


    // move entities
    const move = (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const e = arr[i];
        e.x += e.vx;
        e.y += e.vy;
        // remove off‑screen
        if (e.x < -50 || e.x > width + 50 || e.y < -50 || e.y > height + 50) arr.splice(i, 1);
      }
    };
    move(asteroids);
    move(lasers);

    // collisions
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    // player vs asteroids / lasers
    for (const a of [...asteroids, ...lasers]) {
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const rad = a.size || a.length / 2;
      if (Math.hypot(dx, dy) < player.size + rad) {
        gameOver = true;
        // spawn explosion particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 2,
            alpha: 1,
            decay: Math.random() * 0.02 + 0.01,
          });
        }
        playTone(120, 0.2); // collision explosion
      }
    }
    // player vs fuel
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
if (dist(f, player) < player.size + f.radius) {
          score += 10;
          fuels.splice(i, 1);
          playTone(500, 0.05); // fuel collect
        }
    }

    // spawn logic
    if (frame % 60 === 0) spawnAsteroid(); // roughly 1 per second
    if (frame % 90 === 0) spawnLaser(); // ~0.7 per second
    if (frame % 300 === 0) spawnFuel(); // every 5 seconds
    frame++;
  }

  function draw() {
    // background gradient
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // starfield background
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ship trail (simple fading circle)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // player ship (triangle) with rotation
    ctx.save();
    ctx.translate(player.x, player.y);
    const angle = player.angle || 0;
    ctx.rotate(angle);
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.size);
    ctx.lineTo(-player.size, player.size);
    ctx.lineTo(player.size, player.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids (with simple gradient)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // lasers with glow
    ctx.save();
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f00';
    for (const l of lasers) {
      ctx.fillRect(l.x, l.y, 2, l.length);
    }
    ctx.restore();
    // fuels (glow effect)
    for (const f of fuels) {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 12;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // particles (explosion effect)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#f80';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
