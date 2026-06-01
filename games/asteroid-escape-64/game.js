// Asteroid Escape – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('pointermove', resumeAudio);

  // background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.value = 30;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  // utility to play a short tone
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // starfield
  const stars = [];
  const STAR_COUNT = 100;
  const initStars = () => {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * 0.5,
      });
    }
  };

  // full‑window canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars(); // regenerate starfield for new size
  };
  resize();
  window.addEventListener('resize', resize);

  const ship = { x: canvas.width / 2, y: canvas.height - 60, r: 12 };
  const asteroids = [];
  let lastSpawn = 0;
  let gameOver = false;

  // mouse / touch control
  const setPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ship.x = clientX - rect.left;
    ship.y = clientY - rect.top;
  };
  window.addEventListener('pointermove', setPos);

  const spawn = () => {
    const r = 10 + Math.random() * 20;
    asteroids.push({
      x: Math.random() * (canvas.width - 2 * r) + r,
      y: -r,
      r,
      speed: 2 + Math.random() * 3,
    });
    // play spawn tone
    playTone(300, 0.08);
  };

  const update = (dt) => {
    if (gameOver) return;
    // spawn every 800ms
    if (performance.now() - lastSpawn > 800) { spawn(); lastSpawn = performance.now(); }
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
    }
    // collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        gameOver = true;
        // collision sound
        playTone(120, 0.3);
        break;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      const alpha = 0.5 + Math.sin(performance.now() / 500 + s.twinkle) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
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
