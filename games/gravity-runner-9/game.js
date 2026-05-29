// Gravity Runner Game
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Simple beep generator
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  // Game state
  const groundY = height - 40;
  const player = { x: 50, y: groundY - 30, w: 30, h: 30, vy: 0, onGround: true };
  const gravity = 0.8;
  const jumpStrength = -15;
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 1200; // ms
  let lastTime = 0;
  let score = 0;
  let running = true;

  function reset() {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    obstacleTimer = 0;
    score = 0;
    running = true;
    requestAnimationFrame(loop);
  }

  function jump() {
    if (player.onGround) {
      player.vy = jumpStrength;
      player.onGround = false;
      playBeep(440, 120); // jump sound
    }
  }

  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });

  function addObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: width, y: groundY - size, w: size, h: size, speed: 4 + Math.random() * 2 });
  }

  function update(dt) {
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacles
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      addObstacle();
      obstacleTimer = 0;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
          running = false;
          playBeep(220, 300); // collision/game over sound
        }
      }
      if (running) score += dt * 0.01;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#f0e68c'); // light sand
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, width, height - groundY);

    // Player – rounded rectangle with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0066ff';
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Obstacles – spikes (triangles)
    ctx.fillStyle = '#ff3300';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  // Start the game
  reset();
})();
