// Minimal endless runner based on IDEA.md
// Canvas with id="game" in the host HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Helper: draw a filled rounded rectangle (neon style)
  const drawRoundedRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };
  

  // Set canvas size to fill the viewport (adjust as needed)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player (neon dot)
  const player = {
    x: canvas.width * 0.1,
    y: canvas.height - 30,
    radius: 10,
    vy: 0,
    color: '#0ff',
  };
  const GRAVITY = 0.8;
  const JUMP = -15;

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 1500; // ms between obstacles
  const obstacleSpeed = 4; // pixels per frame
  let lastObstacle = 0;

  let running = true;

  const jump = () => {
    if (player.vy === 0) {
      player.vy = JUMP; // only jump when on ground
      playTone(440, 0.1, 'sine'); // jump sound
    }
  };
  // Click/tap listener
  window.addEventListener('pointerdown', jump);

  const spawnObstacle = () => {
    const width = 20 + Math.random() * 30;
    const height = 20 + Math.random() * 60;
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height,
      w: width,
      h: height,
    });
    playTone(330, 0.05, 'square'); // obstacle spawn beep
  };

  const checkCollision = (obs) => {
    // Simple AABB vs circle collision
    const distX = Math.abs(player.x - (obs.x + obs.w / 2));
    const distY = Math.abs(player.y - (obs.y + obs.h / 2));
    if (distX > (obs.w / 2 + player.radius)) return false;
    if (distY > (obs.h / 2 + player.radius)) return false;
    if (distX <= (obs.w / 2)) return true;
    if (distY <= (obs.h / 2)) return true;
    const dx = distX - obs.w / 2;
    const dy = distY - obs.h / 2;
    return (dx * dx + dy * dy <= (player.radius * player.radius));
  };

  const gameLoop = (timestamp) => {
    if (!running) return;
    // Clear and draw background gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update player
    player.vy += GRAVITY;
    player.y += player.vy;
    // Ground check
    const groundY = canvas.height - 30;
    if (player.y > groundY) {
      player.y = groundY;
      player.vy = 0;
    }

    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Spawn obstacles
    if (timestamp - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = timestamp;
    }

    // Update and draw obstacles
    ctx.fillStyle = '#f0f';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Draw
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // Collision
      if (checkCollision(o)) {
        running = false;
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        break;
      }
      // Remove off-screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    requestAnimationFrame(gameLoop);
  };

  requestAnimationFrame(gameLoop);
})();
