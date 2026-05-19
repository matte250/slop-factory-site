// game.js – simple Orb Escape implementation
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Set canvas size (fallback to 800x600 if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const player = {
    x: canvas.width / 4,
    y: canvas.height / 2,
    radius: 12,
    speed: 4,
    dx: 0,
    dy: 0,
  };

  const obstacles = [];
  const particles = []; // particle trail for player
  let obstacleTimer = 0;
  let obstacleInterval = 1500; // ms between spawns
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play a quick tone for movement keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      playTone(400, 50);
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function updatePlayer() {
    // Emit particles when moving
    if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
      emitParticle();
    }
    player.dx = 0;
    player.dy = 0;
    if (keys.ArrowUp) player.dy = -player.speed;
    if (keys.ArrowDown) player.dy = player.speed;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x + player.dx));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y + player.dy));
  }

  function spawnObstacle() {
    const height = 20 + Math.random() * 80;
    const width = 20 + Math.random() * 80;
    const y = Math.random() * (canvas.height - height);
    const speed = 2 + Math.random() * 2 + score / 1000; // gradually faster
    const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    obstacles.push({ x: canvas.width, y, width, height, speed, color });
  }

  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
    // spawn based on timer
    obstacleTimer += delta;
    if (obstacleTimer > obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
      // gradually shrink interval to increase difficulty
      obstacleInterval = Math.max(500, obstacleInterval - 20);
    }
  }

  function circleRectCollision(c, r) {
    // Simple circle-rectangle collision detection
    const closestX = Math.max(r.x, Math.min(c.x, r.x + r.width));
    const closestY = Math.max(r.y, Math.min(c.y, r.y + r.height));
    const dx = c.x - closestX;
    const dy = c.y - closestY;
    return dx * dx + dy * dy < c.radius * c.radius;
  }

  // Emit a small particle at the player's position
  function emitParticle() {
    const p = {
      x: player.x,
      y: player.y,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: 500, // ms
    };
    particles.push(p);
  }

  // Update and remove dead particles
  function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * delta * 0.1;
      p.y += p.vy * delta * 0.1;
      p.life -= delta;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }


  function checkCollisions() {
    for (const o of obstacles) {
      if (circleRectCollision(player, o)) {
        gameOver = true;
        // Play collision sound (low tone)
        playTone(150, 300);
        break;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#013');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Render particles (fade out)
    for (const p of particles) {
      const alpha = Math.max(p.life / 500, 0);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Player with radial gradient
    const playerGrad = ctx.createRadialGradient(
      player.x,
      player.y,
      player.radius * 0.2,
      player.x,
      player.y,
      player.radius
    );
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#00f');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Obstacles (colored)
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      updatePlayer();
      updateObstacles(delta);
      updateParticles(delta);
      checkCollisions();
      score += delta * 0.1; // score grows with time
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
