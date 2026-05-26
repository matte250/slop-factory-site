// Game: Pixel Dodger
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone player
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size (fallback if not set via CSS/HTML)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  // Player (square) definition
  const player = {
    width: 50,
    height: 20,
    x: canvas.width / 2 - 25,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(this.x - this.speed, 0);
      if (this.moveRight) this.x = Math.min(this.x + this.speed, canvas.width - this.width);
    },
    draw() {
      // Player gradient rectangle with rounded corners
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#0a84ff');
      grad.addColorStop(1, '#5ac8fa');
      ctx.fillStyle = grad;
      const radius = 5;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.width - radius, this.y);
      ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
      ctx.lineTo(this.x + this.width, this.y + this.height - radius);
      ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
      ctx.lineTo(this.x + radius, this.y + this.height);
      ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
      ctx.lineTo(this.x, this.y + radius);
      ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Falling circles (enemies)
  const enemies = [];
  let spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let difficultyTimer = 0;

  function spawnEnemy() {
    // Play spawn sound
    playTone(200, 100);
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * difficultyTimer / 20000; // increase speed with difficulty
    enemies.push({ x, y: -radius, radius, speed });
  }

  function updateEnemies(delta) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.speed;
      // Remove off-screen enemies
      if (e.y - e.radius > canvas.height) enemies.splice(i, 1);
    }
  }

  function drawEnemies() {
    enemies.forEach(e => {
      // Radial gradient for enemy circles
      const grad = ctx.createRadialGradient(e.x, e.y, e.radius * 0.2, e.x, e.y, e.radius);
      grad.addColorStop(0, '#ff6b6b');
      grad.addColorStop(1, '#c0392b');
      ctx.fillStyle = grad;
      // Shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });
  }

  function checkCollision() {
    for (const e of enemies) {
      const dx = Math.max(player.x - e.x, 0, e.x - (player.x + player.width));
      const dy = Math.max(player.y - e.y, 0, e.y - (player.y + player.height));
      if (dx * dx + dy * dy < e.radius * e.radius) return true;
    }
    return false;
  }

  // Score handling
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') { player.moveLeft = true; playTone(400, 50); }
    if (e.key === 'ArrowRight') { player.moveRight = true; playTone(600, 50); }
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  // Main loop
  let lastTime = performance.now();
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`Score: ${Math.floor(score)}` , canvas.width / 2, canvas.height / 2 + 20);
      return;
    }

    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw player
    player.update();
    player.draw();

    // Spawn enemies based on interval
    lastSpawn += delta;
    if (lastSpawn > spawnInterval) {
      spawnEnemy();
      lastSpawn = 0;
    }

    // Increase difficulty over time (speed up spawns)
    difficultyTimer += delta;
    if (difficultyTimer > 10000 && spawnInterval > 400) {
      spawnInterval -= 100; // faster spawns
      difficultyTimer = 0;
    }

    // Update and draw enemies
    updateEnemies(delta);
    drawEnemies();

    // Update score
    score += delta * 0.01; // score based on time survived

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    // Collision check
    if (checkCollision()) {
      gameOver = true;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
