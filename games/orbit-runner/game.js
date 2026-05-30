// Minimal Orbit Runner game implementation
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Game settings
  const lanes = 3;
  const laneWidth = width / lanes;
  const shipSize = laneWidth * 0.6;
  const shipY = height - shipSize * 1.5;
  const scrollSpeed = 2; // pixels per frame
  const obstacleSize = shipSize * 0.9;
  const spawnInterval = 120; // frames

  let shipLane = 1; // start in middle lane (0,1,2)
  let frameCount = 0;
  let obstacles = [];
  let gameOver = false;
  // starfield particles
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playLaneChange() { playTone(300, 0.1); }
  function playCollision() { playTone(100, 0.3); }

  // Handle player input – tap/click cycles lane left/right
  canvas.addEventListener('click', () => {
    if (gameOver) return;
    // Cycle through lanes: 0 -> 1 -> 2 -> 0 ...
    shipLane = (shipLane + 1) % lanes;
    playLaneChange();
  });

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * lanes);
    obstacles.push({ lane, y: -obstacleSize });
  }

  // Update star positions for scrolling effect
  function updateStars() {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
  }

  function update() {
    if (gameOver) return;
    frameCount++;
    if (frameCount % spawnInterval === 0) spawnObstacle();

    // Move stars
    updateStars();

    // Move obstacles downwards
    obstacles.forEach(o => o.y += scrollSpeed);
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.y < height + obstacleSize);

    // Collision detection
    const shipX = shipLane * laneWidth + laneWidth / 2;
    for (const o of obstacles) {
      const obsX = o.lane * laneWidth + laneWidth / 2;
      const dy = o.y - shipY;
      const dx = obsX - shipX;
      const dist = Math.hypot(dx, dy);
      if (dist < (shipSize + obstacleSize) / 2) {
        playCollision();
        gameOver = true;
        break;
      }
    }
  }

  function drawBackground() {
    // Neon gradient with moving starfield
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a001f');
    grad.addColorStop(1, '#001030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShip() {
    const x = shipLane * laneWidth + laneWidth / 2;
    // Neon gradient for ship
    const grad = ctx.createRadialGradient(x, shipY, shipSize * 0.1, x, shipY, shipSize / 2);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#006');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, shipY - shipSize / 2);
    ctx.lineTo(x - shipSize / 2, shipY + shipSize / 2);
    ctx.lineTo(x + shipSize / 2, shipY + shipSize / 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawObstacles() {
    ctx.fillStyle = '#f0f'; // neon magenta
    obstacles.forEach(o => {
      const x = o.lane * laneWidth + laneWidth / 2;
      ctx.beginPath();
      ctx.moveTo(x, o.y - obstacleSize / 2);
      ctx.lineTo(x - obstacleSize / 2, o.y + obstacleSize / 2);
      ctx.lineTo(x + obstacleSize / 2, o.y + obstacleSize / 2);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  function loop() {
    update();
    drawBackground();
    // Apply neon glow for ship and obstacles
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    drawShip();
    drawObstacles();
    // Reset shadow
    ctx.shadowBlur = 0;
    if (gameOver) drawGameOver();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
