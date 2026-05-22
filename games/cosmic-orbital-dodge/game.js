// Minimal Cosmic Orbital Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 400;
  const cx = width / 2,
        cy = height / 2;

  // starfield background
  const starCount = 100;
  const stars = Array.from({length: starCount}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5
  }));

  // Game parameters
  const orbitR = Math.min(width, height) * 0.35;
  const shipR = 8;
  const astR = 10;
  const shipSpeed = 0.04; // rad per frame when key pressed
  const asteroidSpeed = 1.5; // pixels per frame toward center
  const spawnInterval = 1500; // ms

  let angle = 0;
  let left = false,
      right = false;
  let asteroids = [];
  let lastSpawn = 0;
  let startTime = null;
  let alive = true;

  // Audio setup
  let audioCtx = null;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  const playTone = (freq, dur) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  };
  const keyDown = e => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
    initAudio(); // unlock audio on first interaction
  };
  const keyUp = e => { if (e.key === 'ArrowLeft') left = false; if (e.key === 'ArrowRight') right = false; };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  function spawnAsteroid() {
    const a = Math.random() * Math.PI * 2;
    const r = Math.max(width, height); // start off‑screen
    asteroids.push({a, r});
  }

  let lastMoveSound = 0;
  function update(dt) {
    if (!alive) return;
    // ship movement
    if (left) angle -= shipSpeed;
    if (right) angle += shipSpeed;
    // keep angle in [0,2π)
    angle = (angle + Math.PI * 2) % (Math.PI * 2);

    // movement sound (thrust)
    if ((left || right) && performance.now() - lastMoveSound > 200) {
      playTone(250, 60);
      lastMoveSound = performance.now();
    }

    // spawn
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      playTone(300, 80); // asteroid spawn sound
      lastSpawn = performance.now();
    }

    // move asteroids inward
    for (const a of asteroids) {
      a.r -= asteroidSpeed;
    }
    // remove passed asteroids
    asteroids = asteroids.filter(a => a.r > 0);

    // collision: when asteroid reaches orbit radius
    for (const a of asteroids) {
      if (a.r <= orbitR + astR && a.r >= orbitR - astR) {
        const diff = Math.abs(((a.a - angle + Math.PI) % (2 * Math.PI)) - Math.PI);
        if (diff < (shipR + astR) / orbitR) {
          playTone(150, 200); // collision sound
          alive = false;
          break;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with gradient
    const planetGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbitR * 0.15);
    planetGrad.addColorStop(0, '#555');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR * 0.15, 0, Math.PI * 2);
    ctx.fill();
    // orbit path with glow
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
    ctx.stroke();
    // ship as triangle
    const sx = cx + Math.cos(angle) * orbitR;
    const sy = cy + Math.sin(angle) * orbitR;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    const tipX = sx + Math.cos(angle) * shipR * 2;
    const tipY = sy + Math.sin(angle) * shipR * 2;
    const leftX = sx + Math.cos(angle + Math.PI * 0.75) * shipR;
    const leftY = sy + Math.sin(angle + Math.PI * 0.75) * shipR;
    const rightX = sx + Math.cos(angle - Math.PI * 0.75) * shipR;
    const rightY = sy + Math.sin(angle - Math.PI * 0.75) * shipR;
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    // asteroids with simple shading
    for (const a of asteroids) {
      const x = cx + Math.cos(a.a) * a.r;
      const y = cy + Math.sin(a.a) * a.r;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, astR);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, astR, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', cx, cy);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastSpawn || timestamp);
    update(dt);
    draw();
    if (alive) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
