// Simple Canvas Dodge game
// Targets <canvas id="game"></canvas> in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };

  // Resize canvas to fill parent or window
  let resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Player definition
  // Player as a circle
  const player = {
    x: 50, // center X
    y: 0, // top Y of bounding box
    r: 15,
    vy: 0,
    color: '#00f',
  };

  const gravity = 0.4;
  const jumpStrength = -8;

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  let lastSpawn = 0;

  let gameOver = false;

  // Input: click/tap makes the player jump if on ground
  const onInput = () => {
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.y + player.r * 2 >= canvas.height) {
      player.vy = jumpStrength;
      // play jump sound
      playTone(400, 0.15);
    }
  };
  canvas.addEventListener('click', onInput);
  canvas.addEventListener('touchstart', onInput);

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 40;
    const hue = Math.floor(Math.random() * 360);
    obstacles.push({
      x: canvas.width,
      y: canvas.height - size,
      w: size,
      h: size,
      color: `hsl(${hue}, 70%, 50%)`,
      speed: 3 + Math.random() * 2,
    });
  };

  // Stars for background
  const stars = [];
  const starCount = 80;
  const initStars = () => {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
      });
    }
  };

  // Extend resize to reinitialize stars
  const origResize = resize;
  resize = () => {
    origResize();
    initStars();
  };
  // Initial star field
  initStars();

  // Circle-rectangle collision detection (player is a circle)
  const circleRectIntersect = (circle, rect) => {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy <= circle.r * circle.r;
  };

  const update = (dt) => {
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.r * 2 > canvas.height) {
      player.y = canvas.height - player.r * 2;
      player.vy = 0;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= obs.speed;
      if (obs.x + obs.w < 0) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const obs of obstacles) {
      // Treat player as circle for collision
        const circle = { x: player.x, y: player.y + player.r, r: player.r };
    if (circleRectIntersect(circle, obs)) {
      gameOver = true;
      // play collision sound
      playTone(200, 0.3);
      break;
    }
    }
  };

  const draw = () => {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#e0f7fa'); // light cyan
    bg.addColorStop(1, '#006064'); // dark teal
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw star field
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player as a circle
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y + player.r, player.r, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles (colored squares)
    for (const obs of obstacles) {
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let lastTime = 0;
  const loop = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      if (timestamp - lastSpawn > obstacleFreq) {
        spawnObstacle();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
