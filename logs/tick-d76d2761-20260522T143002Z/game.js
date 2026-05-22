// Minimal Orbital Dodge game – enhanced graphics with sounds
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure AudioContext is resumed on first user gesture
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  ['click','keydown','mousemove'].forEach(ev => document.addEventListener(ev, resumeAudio, {once:true}));

  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };

  const playLaserSound = () => playTone(800, 0.1);
  const playExplosionSound = () => playTone(200, 0.2);
  const playGameOverSound = () => playTone(100, 0.5);
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    center = { x: canvas.width / 2, y: canvas.height / 2 };
    // Initialize stars based on canvas size
    stars.length = 0;
    const starCount = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  };
  window.addEventListener('resize', resize);
  resize();

  // Game state
  let shipAngle = 0; // radians, 0 points up
  const shipRadius = 15;
  const lasers = [];
  const asteroids = [];
  const stars = [];
  let score = 0;
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let gameOver = false;
  let lastTime = 0;
  let center = { x: canvas.width / 2, y: canvas.height / 2 };

  // Input handling
  const keys = {};
  document.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') e.preventDefault(); });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    shipAngle = Math.atan2(my - center.y, mx - center.x) + Math.PI / 2; // ship points up
  });

  const fireLaser = () => {
    lasers.push({
      x: center.x,
      y: center.y,
      angle: shipAngle,
      life: 0,
    });
    playLaserSound();
  };

  const spawnAsteroid = () => {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const buffer = 20;
    if (side === 0) { x = -buffer; y = Math.random() * canvas.height; }
    else if (side === 1) { x = canvas.width + buffer; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = -buffer; }
    else { x = Math.random() * canvas.width; y = canvas.height + buffer; }
    const angle = Math.atan2(center.y - y, center.x - x);
    const speed = 0.5 + Math.random() * 0.5;
    asteroids.push({ x, y, angle, speed, radius: 12 });
  };

  const update = (delta) => {
    if (gameOver) return;
    // Controls
    if (keys.ArrowLeft) shipAngle -= 0.03;
    if (keys.ArrowRight) shipAngle += 0.03;
    if (keys[' ']) { fireLaser(); keys[' '] = false; }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      const speed = 5;
      l.x += Math.cos(l.angle) * speed;
      l.y += Math.sin(l.angle) * speed;
      l.life += delta;
      if (l.life > 2000) lasers.splice(i, 1);
    }

    // Spawn asteroids
    lastSpawn += delta;
    if (lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = 0;
      // gradually increase difficulty
      spawnInterval = Math.max(500, spawnInterval - 20);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += Math.cos(a.angle) * a.speed;
      a.y += Math.sin(a.angle) * a.speed;
      // Collision with ship
      const dx = a.x - center.x;
      const dy = a.y - center.y;
        if (Math.hypot(dx, dy) < a.radius + shipRadius) {
        gameOver = true;
        playGameOverSound();
      }
    }

    // Twinkling stars (subtle alpha change)
    stars.forEach(s => {
      s.alpha += (Math.random() - 0.5) * 0.02; // slight jitter
      if (s.alpha < 0.3) s.alpha = 0.3;
      if (s.alpha > 0.8) s.alpha = 0.8;
    });

    // Laser‑asteroid collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (Math.hypot(l.x - a.x, l.y - a.y) < a.radius) {
          // destroy both
          lasers.splice(i, 1);
          asteroids.splice(j, 1);
          score++;
          playExplosionSound();
          break;
        }
      }
    }
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ship (triangle with gradient and outline)
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(shipAngle);
    const shipGrad = ctx.createRadialGradient(0, 0, shipRadius * 0.2, 0, 0, shipRadius);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -shipRadius);
    ctx.lineTo(shipRadius / 2, shipRadius);
    ctx.lineTo(-shipRadius / 2, shipRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Lasers with glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - Math.cos(l.angle) * 10, l.y - Math.sin(l.angle) * 10);
      ctx.stroke();
    });
    ctx.restore();

    // Asteroids with shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  };

  const loop = (timestamp) => {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
