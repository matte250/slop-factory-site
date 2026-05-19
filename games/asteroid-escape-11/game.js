// Asteroid Escape – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // helper to play a short tone
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // quick fade‑in/out to avoid clicks
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  // ensure audio context is resumed on first interaction
  function resumeAudio(){if(audioCtx.state==='suspended')audioCtx.resume();}
  window.addEventListener('mousedown',resumeAudio);
  window.addEventListener('keydown',resumeAudio);
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Stars for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship
  const ship = { x: width / 2, y: height - 60, r: 12, vx: 0, vy: 0, speed: 2 };
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawn = () => {
    // play a subtle spawn sound
    playTone(600, 80);
    const size = 15 + Math.random() * 20;
    const x = Math.random() * width;
    const y = -size;
    const vy = 1 + Math.random() * 2;
    asteroids.push({ x, y, r: size, vy });
  };
  let spawnTimer = 0;

  // Simple collision
  const collides = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  };

  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    // ship controls
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y));
    // background stars scroll down for parallax effect
    stars.forEach(s => {
      s.y += 0.3;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    // asteroids
    spawnTimer -= dt;
    if (spawnTimer <= 0) { asteroidSpawn(); spawnTimer = 1000; }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      if (a.y - a.r > height) asteroids.splice(i, 1);
      else if (collides(ship, a)) { playTone(200, 300); gameOver = true; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background stars
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship – simple green triangle with stroke
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#080';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // asteroids – radial gradient circles for depth
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
