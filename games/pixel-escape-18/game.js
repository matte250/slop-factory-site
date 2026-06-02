// Minimal canvas game based on IDEA.md
// Improved graphics: gradient background, glowing player, colored walls, score display.

(() => {
  // Audio setup (lazy init on first interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', resumeAudio, {once: true});
  window.addEventListener('click', resumeAudio, {once: true});

  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playSpawn() { playTone(400, 0.05); }
  function playCollision() { playTone(150, 0.3); }

  // Original game code starts here
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player
  const player = {
    x: width / 2,
    y: height - 30,
    radius: 6,
    speed: 4,
  };

  // Walls – each wall is {x, w, y, h}
  const walls = [];
  const wallHeight = 10;
  const wallSpawnInterval = 80; // frames
  let frameCount = 0;
  let running = true;
  let score = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  function spawnWall() {
    // Play spawn sound
    playSpawn();
    const wallWidth = Math.random() * (width * 0.4) + width * 0.2; // 20-60% width
    const x = Math.random() * (width - wallWidth);
    // Assign a random hue for visual variety
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 50%)`;
    walls.push({ x, w: wallWidth, y: -wallHeight, h: wallHeight, color });
  }

  function update() {
    // Move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Clamp position
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));

    // Dynamic wall speed based on score
    const wallSpeed = 2 + Math.floor(score / 500);

    // Move walls downwards
    for (const wall of walls) {
      wall.y += wallSpeed;
    }
    // Remove off‑screen walls
    while (walls.length && walls[0].y > height) walls.shift();

    // Spawn walls
    if (frameCount % wallSpawnInterval === 0) spawnWall();
    frameCount++;

    // Increment score each frame
    score++;

    // Collision detection (point vs rectangle)
    for (const wall of walls) {
      if (
        player.x > wall.x &&
        player.x < wall.x + wall.w &&
        player.y - player.radius < wall.y + wall.h &&
        player.y + player.radius > wall.y
      ) {
        playCollision();
        running = false;
        break;
      }
    }
  }

  function draw() {
    // Gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#15154f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw glowing player
    const glow = ctx.createRadialGradient(
      player.x,
      player.y,
      player.radius,
      player.x,
      player.y,
      player.radius * 4
    );
    glow.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
    glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw walls with individual colors
    for (const wall of walls) {
      ctx.fillStyle = wall.color || 'black';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    // Draw score
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.font = '24px sans-serif';
      ctx.fillStyle = 'black';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
