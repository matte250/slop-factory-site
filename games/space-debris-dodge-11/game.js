// Space Debris Dodge game
// Canvas element with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollision() {
    // Low‑pitched blast
    playSound(150, 300);
  }

  // Set canvas size (you can adjust or make it responsive)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = {
    width: 40,
    height: 40,
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    speed: 5,
    color: '#0f0',
  };

  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  const debris = [];
  const debrisSize = 30;
  const debrisSpeed = 3;
  let lastSpawn = 0;
  const spawnInterval = 800; // ms

  let startTime = null;
  let gameOver = false;

  function spawnDebris() {
    const x = Math.random() * (canvas.width - debrisSize);
    debris.push({ x, y: -debrisSize, size: debrisSize });
  }

  function update(delta) {
    // Player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;

    // Keep player inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Spawn debris
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // Update debris positions and check collision
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += debrisSpeed;
      // Remove off‑screen debris
      if (d.y > canvas.height) {
        debris.splice(i, 1);
        continue;
      }
      // Simple AABB collision
      if (
        player.x < d.x + d.size &&
        player.x + player.width > d.x &&
        player.y < d.y + d.size &&
        player.y + player.height > d.y
      ) {
        playCollision();
        gameOver = true;
      }
    }
  }

  // Draw background stars
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  function drawBackground() {
    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001d3d'); // dark blue
    gradient.addColorStop(1, '#000511'); // near black
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Move and draw stars
    ctx.fillStyle = '#fff';
    stars.forEach((s) => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw() {
    drawBackground();

    // Draw player as triangle ship
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Draw rotating debris (simple polygons)
    ctx.fillStyle = '#f66';
    debris.forEach((d) => {
      const angle = (performance.now() / 200) % (Math.PI * 2);
      const half = d.size / 2;
      ctx.save();
      ctx.translate(d.x + half, d.y + half);
      ctx.rotate(angle);
      ctx.translate(-half, -half);
      ctx.fillRect(0, 0, d.size, d.size);
      ctx.restore();
    });

    // Draw score with glow effect
    ctx.shadowColor = 'rgba(0,255,0,0.7)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#0f0';
    ctx.font = '20px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${seconds}s`, 10, 30);
    ctx.shadowBlur = 0; // reset

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Survived: ${seconds}s`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;

    if (!gameOver) {
      update(delta);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  let lastFrame = null;
  requestAnimationFrame(loop);
})();
