// Simple Shrinking Orb Survival game
// Canvas with id="game" must exist in the HTML.
// Arrow keys / WASD move the orb. It continuously shrinks and must avoid
// randomly spawning rectangular obstacles. Game ends when the orb collides
// with an obstacle or its radius falls below MIN_RADIUS.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Sound effects
  const sound = {
    spawn: () => playTone(600, 0.08),
    crash: () => playTone(150, 0.3),
    // Optional ambient hum
    hum: () => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(30, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      // keep running
    }
  };
  // Start ambient hum
  sound.hum();
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const STATE = {
    running: true,
    score: 0,
    lastTime: performance.now(),
  };

  const PLAYER = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 30,
    speed: 200, // px per second
    vx: 0,
    vy: 0,
  };

  const MIN_RADIUS = 5;
  const SHRINK_RATE = 5; // radius per second

  const OBSTACLE = {
    width: 40,
    height: 40,
    speed: 100, // px per second
    spawnInterval: 1500, // ms
    lastSpawn: 0,
  };

  const obstacles = [];

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  function update(dt) {
    if (!STATE.running) return;
    // Move player
    PLAYER.vx = PLAYER.vy = 0;
    if (keys['arrowleft'] || keys['a']) PLAYER.vx = -1;
    if (keys['arrowright'] || keys['d']) PLAYER.vx = 1;
    if (keys['arrowup'] || keys['w']) PLAYER.vy = -1;
    if (keys['arrowdown'] || keys['s']) PLAYER.vy = 1;
    // Normalize diagonal speed
    if (PLAYER.vx && PLAYER.vy) {
      const norm = Math.SQRT1_2; // 1/√2
      PLAYER.vx *= norm;
      PLAYER.vy *= norm;
    }
    PLAYER.x += PLAYER.vx * PLAYER.speed * dt;
    PLAYER.y += PLAYER.vy * PLAYER.speed * dt;
    // Keep inside canvas
    PLAYER.x = Math.max(PLAYER.radius, Math.min(canvas.width - PLAYER.radius, PLAYER.x));
    PLAYER.y = Math.max(PLAYER.radius, Math.min(canvas.height - PLAYER.radius, PLAYER.y));

    // Shrink orb
    PLAYER.radius -= SHRINK_RATE * dt;
if (PLAYER.radius <= MIN_RADIUS) {
        sound.crash();
        endGame();
      }

    // Spawn obstacles
    OBSTACLE.lastSpawn += dt * 1000;
    if (OBSTACLE.lastSpawn >= OBSTACLE.spawnInterval) {
      OBSTACLE.lastSpawn = 0;
      spawnObstacle();
    }

    // Move obstacles and remove off‑screen ones
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.x < -o.w || o.x > canvas.width || o.y < -o.h || o.y > canvas.height) {
        obstacles.splice(i, 1);
        continue;
      }
      // Collision with player (circle‑rect)
      if (circleRectCollide(PLAYER, o)) {
        endGame();
        return;
      }
    }

    // Update score (seconds survived)
    STATE.score += dt;
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background gradient for depth
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Trail effect: semi‑transparent overlay to fade previous frames
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player orb with radial gradient and glow
    const orbGrad = ctx.createRadialGradient(
      PLAYER.x, PLAYER.y, PLAYER.radius * 0.1,
      PLAYER.x, PLAYER.y, PLAYER.radius
    );
    orbGrad.addColorStop(0, '#8BC34A');
    orbGrad.addColorStop(1, '#558B2F');
    ctx.fillStyle = orbGrad;
    ctx.shadowColor = '#8BC34A';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(PLAYER.x, PLAYER.y, PLAYER.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent'; // reset

    // Draw obstacles with rounded corners
    ctx.fillStyle = '#D32F2F';
    obstacles.forEach(o => {
      const r = 6; // corner radius
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.w - r, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + r);
      ctx.lineTo(o.x + o.w, o.y + o.h - r);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - r, o.y + o.h);
      ctx.lineTo(o.x + r, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.closePath();
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#FFF';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(STATE.score)}`, 10, 20);
    ctx.fillText(`Radius: ${Math.floor(PLAYER.radius)}`, 10, 40);
    if (!STATE.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFF';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(STATE.score)}`,
        canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - STATE.lastTime) / 1000; // seconds
    STATE.lastTime = timestamp;
    update(dt);
    render();
    if (STATE.running) requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    // Play spawn sound
    sound.spawn();
    // Random edge spawn
    const side = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    const w = OBSTACLE.width;
    const h = OBSTACLE.height;
    let x, y, vx, vy;
    const speed = OBSTACLE.speed;
    switch (side) {
      case 0: // top
        x = Math.random() * (canvas.width - w);
        y = -h;
        vx = 0; vy = speed;
        break;
      case 1: // right
        x = canvas.width;
        y = Math.random() * (canvas.height - h);
        vx = -speed; vy = 0;
        break;
      case 2: // bottom
        x = Math.random() * (canvas.width - w);
        y = canvas.height;
        vx = 0; vy = -speed;
        break;
      default: // left
        x = -w;
        y = Math.random() * (canvas.height - h);
        vx = speed; vy = 0;
    }
    obstacles.push({ x, y, w, h, vx, vy });
  }

  function circleRectCollide(circle, rect) {
    // Find closest point on rect to circle centre
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy < circle.radius * circle.radius;
  }

  function endGame() {
    STATE.running = false;
  }

  // Start loop
  requestAnimationFrame(loop);
})();
