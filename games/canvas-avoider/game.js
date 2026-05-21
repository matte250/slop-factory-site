// Game: Canvas Avoider with enhanced graphics
// Controls: Arrow keys to move the player (blue dot).
// Obstacles (red circles) spawn randomly and drift leftwards.
// Lose when player collides with an obstacle or leaves the canvas.

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
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
  // Set canvas to its displayed size or fallback
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Player configuration
  const player = {
    x: width / 2,
    y: height / 2,
    radius: 8,
    speed: 3,
    vx: 0,
    vy: 0,
  };

  // Obstacle configuration
  const obstacles = [];
  const baseObstacleRadius = 12;
  const obstacleSpeed = 2; // leftward drift
  const spawnInterval = 1500; // ms

  let lastSpawn = 0;
  let animationId = null;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Play a subtle move tone
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)) {
      playSound(400, 0.05);
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function updatePlayer() {
    player.vx = 0;
    player.vy = 0;
    if (keys['ArrowLeft'] || keys['a']) player.vx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.vx = player.speed;
    if (keys['ArrowUp'] || keys['w']) player.vy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.vy = player.speed;
    player.x += player.vx;
    player.y += player.vy;
  }

  function spawnObstacle() {
    const radius = baseObstacleRadius + Math.random() * 6; // 12-18
    const hue = 0; // red
    const saturation = 70 + Math.random() * 20; // 70-90%
    const lightness = 40 + Math.random() * 20; // 40-60%
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const y = Math.random() * height;
    const x = width + radius; // start just outside right edge
    obstacles.push({ x, y, radius, color });
  }


  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Remove off‑screen obstacles
      if (o.x + o.radius < 0) obstacles.splice(i, 1);
    }
  }

  function checkCollision() {
    // Bounds check
    if (
      player.x - player.radius < 0 ||
      player.x + player.radius > width ||
      player.y - player.radius < 0 ||
      player.y + player.radius > height
    ) {
      return true;
    }
    // Obstacle collision (circle‑circle)
    for (const o of obstacles) {
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const distSq = dx * dx + dy * dy;
      const radSum = player.radius + o.radius;
      if (distSq < radSum * radSum) return true;
    }
    return false;
  }

  let score = 0;
const stars = [];
const starCount = 80;
function initStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
}
initStars();
function updateStars() {
  for (const s of stars) {
    s.x -= s.speed;
    if (s.x < 0) {
      s.x = width;
      s.y = Math.random() * height;
    }
  }
}
function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw moving star field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Player with radial gradient
    const pGrad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.3, player.x, player.y, player.radius);
    pGrad.addColorStop(0, '#88c');
    pGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles with individual colors
    for (const o of obstacles) {
      ctx.fillStyle = o.color || '#ff3300';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }


  function loop(timestamp) {
    // Update star field for twinkling effect
    updateStars();
    // Increment score based on time survived (1 point per frame)
    score++;
    // Cap score display to integer
    score = Math.floor(score);
    if (!lastSpawn) lastSpawn = timestamp;
    const delta = timestamp - lastSpawn;
    if (delta > spawnInterval) {
      spawnObstacle();
      lastSpawn = timestamp;
    }
    updatePlayer();
    updateObstacles(delta);
    if (checkCollision()) {
      // Collision sound
      playSound(150, 0.4);
      cancelAnimationFrame(animationId);
      alert('Game Over');
      return;
    }
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // Start the game loop
  animationId = requestAnimationFrame(loop);
})();
