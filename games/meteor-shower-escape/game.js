// Simple Meteor Shower Escape game
// Assumes a <canvas id="game"></canvas> exists in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    r: 12,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    drag: 0.98,
  };

  const meteors = [];
  const MeteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let alive = true;

  // Input handling – arrow keys add thrust in the direction pressed.
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let soundUnlocked = false;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function unlockSound() {
    if (!soundUnlocked) {
      // resume context on first user interaction
      audioCtx.resume();
      soundUnlocked = true;
    }
  }
  function playThrustSound() { playTone(400, 0.05); }
  function playCrashSound() { playTone(150, 0.5); }

  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      unlockSound();
      // play thrust sound on each key press
      playThrustSound();
    }
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnMeteor() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * canvas.width;
    const speed = Math.random() * 2 + 1;
    meteors.push({ x, y: -size, r: size, vy: speed });
  }

  function update(dt) {
    // Player thrust
    if (keys.ArrowUp) player.vy -= player.thrust;
    if (keys.ArrowDown) player.vy += player.thrust;
    if (keys.ArrowLeft) player.vx -= player.thrust;
    if (keys.ArrowRight) player.vx += player.thrust;

    // Apply drag/inertia
    player.vx *= player.drag;
    player.vy *= player.drag;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Off‑screen lose condition
    if (player.x < -player.r || player.x > canvas.width + player.r ||
        player.y < -player.r || player.y > canvas.height + player.r) {
      playCrashSound();
      alive = false;
    }

    // Meteor movement & collision
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.vy * dt;
      // Remove off‑screen meteors
      if (m.y - m.r > canvas.height) meteors.splice(i, 1);
      // Simple circle collision
      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < m.r + player.r) { playCrashSound(); alive = false; }
    }

    // Spawn new meteors
    if (performance.now() - lastSpawn > MeteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Background: dark space with stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars (static small points)
    if (!window._stars) {
      const count = 100;
      window._stars = [];
      for (let i = 0; i < count; i++) {
        window._stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          s: Math.random() * 2 + 0.5,
        });
      }
    }
    ctx.fillStyle = '#fff';
    window._stars.forEach(st => {
      ctx.fillRect(st.x, st.y, st.s, st.s);
    });

    // Draw player as a triangle (blue)
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.lineTo(player.x + player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();

    // Draw meteors with radial gradient for a glowing effect
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(200,200,200,0.9)');
      grad.addColorStop(1, 'rgba(100,100,100,0.5)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop(timestamp) {
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    const dt = 0.016; // approx 60fps fixed step
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
