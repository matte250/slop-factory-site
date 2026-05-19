// game.js - Simple side‑scrolling endless runner
// Target canvas with id "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // Fade in/out to avoid clicks
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(300, 0.1); }
  function playGameOverSound() { playTone(100, 0.3); }

  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 200);
  // Ground settings
  const groundHeight = 20;
  let groundOffset = 0;

  // Player settings
  const player = {
    x: 50,
    y: height - groundHeight - 40,
    width: 30,
    height: 40,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.6,
    onGround: true,
  };

  // Obstacle settings
  const obstacles = [];
  const obstacleFreq = 1500; // ms between spawns
  const obstacleSpeed = 4;

  let lastSpawn = 0;
  let running = true;
  let gameOverPlayed = false;

  function spawnObstacle() {
    const h = 30 + Math.random() * 30; // height 30‑60
    obstacles.push({
      x: width,
      y: height - groundHeight - h,
      width: 20,
      height: h,
    });
  }

  function update(dt) {
    // Player physics
    if (!player.onGround) {
      player.vy += player.gravity;
    }
    player.y += player.vy;
    if (player.y + player.height >= height - groundHeight) {
      player.y = height - groundHeight - player.height;
      player.vy = 0;
      player.onGround = true;
    }

    // Move ground for scrolling effect
    groundOffset = (groundOffset - obstacleSpeed) % width;

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    if (performance.now() - lastSpawn > obstacleFreq) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        running = false; // stop the game
      }
    }
  }

  function draw() {
    // Sky background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);

    // Player – draw as rounded rectangle
    ctx.fillStyle = '#4A90E2';
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.width - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + radius);
    ctx.lineTo(player.x + player.width, player.y + player.height - radius);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height);
    ctx.lineTo(player.x + radius, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // Obstacles – draw as simple triangles
    ctx.fillStyle = '#D0021B';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.height);
      ctx.lineTo(o.x + o.width / 2, o.y);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.closePath();
      ctx.fill();
    });
  }

  function loop(timestamp) {
    if (!running) {
      // Play game over sound once
      if (!gameOverPlayed) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playGameOverSound();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFF';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  }

  // Input – space bar or mouse click to jump
  function jump() {
    // Ensure audio context is resumed on first interaction
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  }
  document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  // Start loop
  requestAnimationFrame(loop);
})();
