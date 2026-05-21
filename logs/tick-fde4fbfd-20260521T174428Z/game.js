// Simple Meteor Dodge game
// Canvas element with id="game" must exist in HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size (can be overridden by CSS)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollision() { playTone(100, 0.3, 'square'); }
  function playSpawn() { playTone(400, 0.05, 'triangle'); }
  // Background hum
  let bgOsc = null;
  function startBackground() {
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 60;
    bgOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    bgOsc.start();
  }
  function stopBackground() {
    if (bgOsc) {
      bgOsc.stop();
      bgOsc.disconnect();
      bgOsc = null;
    }
  }
  // Start background music
  startBackground();


  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    color: '#0f0',
  };

  const meteors = [];
  const stars = [];
  const starCount = 100;
  // Initialize stars
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
      da: (Math.random() - 0.5) * 0.02,
    });
  }
  const meteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + 2,
      color: '#888',
    });
    playSpawn();
  }

  function update(delta) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    // Clamp
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // Spawn meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off‑screen
      if (m.y - m.size > canvas.height) meteors.splice(i, 1);
    }

    // Update stars (twinkling)
    for (const s of stars) {
      s.alpha += s.da;
      if (s.alpha <= 0.2 || s.alpha >= 1) s.da = -s.da;
    }

    // Collision detection (simple AABB)
    for (const m of meteors) {
      const shipRect = {x: ship.x, y: ship.y, w: ship.width, h: ship.height};
      const meteorRect = {x: m.x, y: m.y, w: m.size, h: m.size};
      if (
        shipRect.x < meteorRect.x + meteorRect.w &&
        shipRect.x + shipRect.w > meteorRect.x &&
        shipRect.y < meteorRect.y + meteorRect.h &&
        shipRect.y + shipRect.h > meteorRect.y
      ) {
        gameOver = true;
        playCollision();
        stopBackground();
        break;
      }
    }
  }

function draw() {
    // Clear canvas with dark space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield (twinkling)
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship as a triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.2,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
