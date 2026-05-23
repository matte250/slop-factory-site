// Minimalist "Pixel Drift" endless runner – enhanced graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill its container
  // Ensure crisp rendering on high-DPI displays
  function fixDpi() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
  }
  function resize() {
    // Adjust size and DPI
    fixDpi();
    initStars(); // regenerate stars for new size
  }
  window.addEventListener('resize', resize);
  resize();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollision() { playTone(200, 300); }
  function playSpawn() { playTone(600, 80); }

// Player (glowing dot)
  const player = {
    x: canvas.width / 2,
    y: canvas.height * 0.8,
    radius: 6,
    color: '#0ff',
  };

  // Mouse controls – move the dot
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  // Star field background
  let stars = [];
  const starCount = 80;
  function initStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.5,
      });
    }
  }
  initStars();
  function updateStars() {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
  }
  function drawStars() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  // Obstacles – moving rectangles
  let obstacles = [];
  let obstacleTimer = 0;
  let speed = 1.5; // pixels per frame
  const speedIncrement = 0.0005; // gradual increase

  function spawnObstacle() {
    const width = 30 + Math.random() * 60;
    const height = 10 + Math.random() * 30;
    const x = Math.random() * (canvas.width - width);
    obstacles.push({ x, y: -height, width, height });
    playSpawn(); // sound on obstacle appearance
  }

  // Simple collision detection
  function collides(ob) {
    const dx = Math.max(ob.x - player.x, 0, player.x - (ob.x + ob.width));
    const dy = Math.max(ob.y - player.y, 0, player.y - (ob.y + ob.height));
    return Math.hypot(dx, dy) < player.radius;
  }

  let gameOver = false;
  let frame = 0;

  function loop() {
    if (gameOver) return;
    frame++;
    // Fade previous frame to create trail effect
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Slight fade overlay for trail effect
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Update and draw star field background
    updateStars();
    drawStars();

    // Update obstacles
    obstacleTimer--;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = Math.max(30, 100 - frame * 0.05);
    }
    obstacles.forEach((ob) => (ob.y += speed));
    obstacles = obstacles.filter((ob) => ob.y < canvas.height);

    // Draw obstacles
    ctx.fillStyle = '#f44';
    obstacles.forEach((ob) => ctx.fillRect(ob.x, ob.y, ob.width, ob.height));

    // Draw player glow
    const grad = ctx.createRadialGradient(
      player.x,
      player.y,
      0,
      player.x,
      player.y,
      player.radius * 4,
    );
    grad.addColorStop(0, 'rgba(0,255,255,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw player core
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Collision check
    if (obstacles.some(collides)) {
      gameOver = true;
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Increase speed gradually
    speed += speedIncrement;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
