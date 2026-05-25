// Simple Space Debris Dodge game
// Canvas element with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship configuration
  const ship = {
    width: 40,
    height: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 5,
    color: '#0ff',
  };

  // Debris configuration
  const debris = [];
  const particles = [];
  let debrisInterval = 1500; // ms between spawns
  let lastSpawn = 0;
  let gameOver = false;
  let startTime = null;
  let speedFactor = 1;

  // Background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
    });
  }

  function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Input handling
  const keys = {};
  // Unlock audio context on first interaction
  let audioUnlocked = false;
  function unlockAudio(){
    if (!audioUnlocked) {
      audioCtx.resume();
      audioUnlocked = true;
    }
  }
  window.addEventListener('keydown', e => { unlockAudio(); keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnDebris() {
    const size = 20 + Math.random() * 30;
    const d = {
      x: Math.random() * (WIDTH - size),
      y: -size,
      size,
      speed: 2 * speedFactor + Math.random() * 2,
      color: '#f55',
    };
    debris.push(d);
    // Sound for new debris
    playSound(300, 0.03);
    // Emit a burst of particles from the spawn point
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: d.x + d.size / 2,
        y: d.y + d.size / 2,
        radius: Math.random() * 2 + 1,
        alpha: 1,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(WIDTH - ship.width, ship.x));

    // Spawn debris
    if (performance.now() - lastSpawn > debrisInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // Update debris positions and check collisions
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed;
      // Remove off‑screen debris
      if (d.y > HEIGHT) debris.splice(i, 1);
      // Collision detection (AABB)
      if (
        d.x < ship.x + ship.width &&
        d.x + d.size > ship.x &&
        d.y < ship.y + ship.height &&
        d.y + d.size > ship.y
      ) {
        playSound(100, 0.2); // collision sound
        gameOver = true;
      }
    }

    // Update particles (simple fading sparkles)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Gradually increase difficulty
    if (!gameOver) {
      speedFactor += dt * 0.00002; // increase speed over time
      debrisInterval = Math.max(300, debrisInterval - dt * 0.01);
    }
  }

  function draw() {
    // Draw background stars
    drawBackground();

    // Draw ship as a triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw debris as rotating squares
    debris.forEach(d => {
      ctx.save();
      ctx.translate(d.x + d.size / 2, d.y + d.size / 2);
      const angle = (performance.now() / 200) % (Math.PI * 2);
      ctx.rotate(angle);
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    });

    // Draw particles (simple fading circles)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score (survival time in seconds)
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
