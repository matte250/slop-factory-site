// Simple canvas runner game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Unlock audio on first user interaction
  const unlock = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('click', unlock, { once: true });
  function playTone(freq, duration) {
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
  function playJump() { playTone(440, 0.1); }
  function playHit() { playTone(150, 0.2); }
  // Player definition
  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: height - 30, // ground position
    vy: 0,
    jumpStrength: -12,
    ducking: false,
    color: '#4CAF50'
  };

  const GRAVITY = 0.5;
  const GROUND = height - player.h;

  // Obstacle definition
  const obstacles = [];
  const obstacleSpeed = 4;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  // Score
  let score = 0;
  let startTime = null;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    unlock();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function spawnObstacle() {
    // Randomly choose type: spike (tall) or block (medium)
    const type = Math.random() < 0.5 ? 'spike' : 'block';
    const w = 20;
    const h = type === 'spike' ? 40 : 30;
    const y = GROUND - (type === 'spike' ? h - player.h : 0);
    obstacles.push({ x: width, y, w, h, type, color: type === 'spike' ? '#f44336' : '#2196F3' });
  }

  function update(dt) {
    // Player physics
    if (keys['ArrowUp'] && player.y >= GROUND) {
      player.vy = player.jumpStrength;
      playJump();
    }
    // Duck: shrink height while down arrow pressed
    if (keys['ArrowDown'] && player.y >= GROUND) {
      player.ducking = true;
    } else {
      player.ducking = false;
    }
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > GROUND) {
      player.y = GROUND;
      player.vy = 0;
    }
    // Adjust player height for ducking
    const currentH = player.ducking ? player.h / 2 : player.h;

    // Move obstacles left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = Date.now();
    }

    // Collision detection
    for (const o of obstacles) {
      const px = player.x;
      const py = player.y + (player.ducking ? player.h / 2 : 0);
      const pw = player.w;
      const ph = currentH;
      if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
        // Game over – stop the loop
        playHit();
        cancelAnimationFrame(animId);
        alert('Game Over! Score: ' + Math.floor(score));
        return;
      }
    }

    // Score based on time/distance
    const now = performance.now();
    if (!startTime) startTime = now;
    score = (now - startTime) / 1000; // seconds survived
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, GROUND, width, 20);
    // Player (rounded)
    ctx.fillStyle = player.color;
    const ph = player.ducking ? player.h / 2 : player.h;
    const py = player.y + (player.ducking ? player.h / 2 : 0);
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, py);
    ctx.lineTo(player.x + player.w - radius, py);
    ctx.quadraticCurveTo(player.x + player.w, py, player.x + player.w, py + radius);
    ctx.lineTo(player.x + player.w, py + ph - radius);
    ctx.quadraticCurveTo(player.x + player.w, py + ph, player.x + player.w - radius, py + ph);
    ctx.lineTo(player.x + radius, py + ph);
    ctx.quadraticCurveTo(player.x, py + ph, player.x, py + ph - radius);
    ctx.lineTo(player.x, py + radius);
    ctx.quadraticCurveTo(player.x, py, player.x + radius, py);
    ctx.closePath();
    ctx.fill();
    // Obstacles with improved graphics
    for (const o of obstacles) {
      if (o.type === 'spike') {
        // Draw triangle spike
        ctx.fillStyle = o.color;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        // Rounded block
        ctx.fillStyle = o.color;
        const radius = 3;
        ctx.beginPath();
        ctx.moveTo(o.x + radius, o.y);
        ctx.lineTo(o.x + o.w - radius, o.y);
        ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
        ctx.lineTo(o.x + o.w, o.y + o.h - radius);
        ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
        ctx.lineTo(o.x + radius, o.y + o.h);
        ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
        ctx.lineTo(o.x, o.y + radius);
        ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Score display
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  let animId;
  function loop(timestamp) {
    const dt = timestamp - (animId ? animId : timestamp);
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
