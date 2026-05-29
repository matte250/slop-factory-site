// Minimal Orb Dodge game targeting canvas with id "game"
// Player: controllable circle via arrow keys
// Orbs: randomly spawn at canvas edges and move toward player
// Collision ends the game and shows final score.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Background ambient tone
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();
  // Ensure audio starts after user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
  }, { once: true });
  // Helper to play a short beep
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Resize canvas to fill its container (or window if no CSS size set)
  function resize() {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  // Generate starfield
  const stars = [];
  const starCount = Math.max(50, Math.floor((canvas.width * canvas.height) / 8000));
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.save();
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Player configuration
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    speed: 4,
    dx: 0,
    dy: 0,
    color: '#00f',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updatePlayer() {
    player.dx = 0;
    player.dy = 0;
    if (keys.ArrowLeft) player.dx = -1;
    if (keys.ArrowRight) player.dx = 1;
    if (keys.ArrowUp) player.dy = -1;
    if (keys.ArrowDown) player.dy = 1;
    const len = Math.hypot(player.dx, player.dy);
    if (len > 0) {
      player.x += (player.dx / len) * player.speed;
      player.y += (player.dy / len) * player.speed;
      // Clamp to canvas
      player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    }
  }

  // Orb handling
  const orbs = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let orbSpeedBase = 1.5; // base speed, increased over time
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnOrb() {
    // Random edge
    const edge = Math.floor(Math.random() * 4); // 0=top,1=right,2=bottom,3=left
    let x, y, dx, dy;
    if (edge === 0) { // top
      x = Math.random() * canvas.width;
      y = -20;
    } else if (edge === 1) { // right
      x = canvas.width + 20;
      y = Math.random() * canvas.height;
    } else if (edge === 2) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + 20;
    } else { // left
      x = -20;
      y = Math.random() * canvas.height;
    }
    // Direction toward player at spawn time
    const angle = Math.atan2(player.y - y, player.x - x);
    const speed = orbSpeedBase + Math.random() * 0.5; // slight variation
    dx = Math.cos(angle) * speed;
    dy = Math.sin(angle) * speed;
    const radius = 10 + Math.random() * 5;
    const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    orbs.push({ x, y, dx, dy, radius, color });
  }

  function updateOrbs(delta) {
    for (const orb of orbs) {
      orb.x += orb.dx * (delta / 16); // normalize to ~60fps frame
      orb.y += orb.dy * (delta / 16);
    }
    // Remove off-screen orbs (optional)
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (o.x < -50 || o.x > canvas.width + 50 || o.y < -50 || o.y > canvas.height + 50) {
        orbs.splice(i, 1);
      }
    }
  }

  function checkCollisions() {
    for (const orb of orbs) {
      const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
      if (dist < player.radius + orb.radius) {
        gameOver = true;
        // Play collision sound (high pitch)
        playBeep(800, 0.2);
        break;
      }
    }
  }

  function draw() {
    // Fade previous frame for motion trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield background
    drawStars();
    // Player with radial gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,255,0.6)';
    ctx.shadowBlur = 12;
    const grad = ctx.createRadialGradient(
      player.x,
      player.y,
      player.radius * 0.2,
      player.x,
      player.y,
      player.radius
    );
    grad.addColorStop(0, '#66f');
    grad.addColorStop(1, '#00f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Orbs with radial gradient, glow, and additive blending
    ctx.globalCompositeOperation = 'lighter';
    for (const orb of orbs) {
      ctx.save();
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 12;
      const orbGrad = ctx.createRadialGradient(
        orb.x,
        orb.y,
        orb.radius * 0.1,
        orb.x,
        orb.y,
        orb.radius
      );
      orbGrad.addColorStop(0, '#fff');
      orbGrad.addColorStop(1, orb.color);
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      const msg = 'Game Over';
      const msgWidth = ctx.measureText(msg).width;
      ctx.fillText(msg, (canvas.width - msgWidth) / 2, canvas.height / 2 - 20);
      const scoreMsg = `Score: ${Math.floor(score)}`;
      const sWidth = ctx.measureText(scoreMsg).width;
      ctx.fillText(scoreMsg, (canvas.width - sWidth) / 2, canvas.height / 2 + 40);
    }
  }

  let lastTime = performance.now();
  function loop(current) {
    const delta = current - lastTime;
    lastTime = current;
    if (!gameOver) {
      // Update difficulty over time
      const elapsed = (current - startTime) / 1000;
      spawnInterval = Math.max(400, 2000 - elapsed * 50); // faster spawns
      orbSpeedBase = 1.5 + elapsed * 0.02; // faster orbs
      // Spawn new orbs
      if (current - lastSpawn > spawnInterval) {
        spawnOrb();
        lastSpawn = current;
      }
      updatePlayer();
      updateOrbs(delta);
      checkCollisions();
      score = (current - startTime) / 1000; // seconds survived
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
