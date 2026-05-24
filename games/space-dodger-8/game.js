// Space Dodger game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  const ship = { x: width / 2, y: height - 30, w: 20, h: 30, speed: 4 };
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playCollision(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  function playThrust(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 300;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  function playSpawn(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 80;
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const asteroids = [];
  let spawnInterval = 1000; // ms
  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 1 + Math.random() * 2 + score * 0.005; // increase with score
    asteroids.push({ x, y: -radius, r: radius, s: speed });
    playSpawn();
  }

  let lastThrustTime = 0;
function update(dt) {
    // ship movement
    let moved = false;
    if (keys.ArrowLeft) { ship.x -= ship.speed; moved = true; }
    if (keys.ArrowRight) { ship.x += ship.speed; moved = true; }
    if (keys.ArrowUp) { ship.y -= ship.speed; moved = true; }
    if (keys.ArrowDown) { ship.y += ship.speed; moved = true; }
    // keep in bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    // thrust sound (throttled)
    if (moved && Date.now() - lastThrustTime > 100) {
      playThrust();
      lastThrustTime = Date.now();
    }

    // spawn logic
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
      // speed up spawning a bit
      spawnInterval = Math.max(200, spawnInterval * 0.98);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.s;
      // remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
      // collision detection (simple AABB vs circle)
      const dx = Math.max(ship.x, Math.min(a.x, ship.x + ship.w)) - a.x;
      const dy = Math.max(ship.y, Math.min(a.y, ship.y + ship.h)) - a.y;
      if (dx * dx + dy * dy < a.r * a.r) {
        playCollision();
        setTimeout(() => {
          alert('Game Over! Score: ' + Math.floor(score / 1000) + 's');
          document.location.reload();
        }, 300);
      }
    }
    score += dt;
  }

  function draw() {
    // background with starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars (static background)
    if (!window.__stars) {
      window.__stars = [];
      for (let i = 0; i < 100; i++) {
        window.__stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
      }
    }
    ctx.fillStyle = 'white';
    window.__stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship (triangle with cyan gradient and stroke)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = 'yellow';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + (score / 1000).toFixed(1) + 's', 10, 20);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
