// Simple Canvas Dodger game
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playCollision = () => playTone(150, 0.3);
  const playScore = () => playTone(400, 0.1);
  const playBoost = () => playTone(600, 0.05);
  const playGameOver = () => playTone(80, 0.6);
  // Ensure audio context resumes on first interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('pointerdown', resumeAudio);
    canvas.removeEventListener('pointerdown', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('pointerdown', resumeAudio);
  canvas.addEventListener('pointerdown', resumeAudio);

  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player configuration
  const player = {
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 5,
    color: '#0a84ff',
    moveLeft: false,
    moveRight: false,
  };

  // Obstacles collection
  const obstacles = [];
  const particles = [];
  const obstacleConfig = {
    w: 40,
    h: 40,
    minSpeed: 2,
    maxSpeed: 6,
    spawnInterval: 1000, // ms
    color: '#ff3b30',
  };

  let lastSpawn = 0;
  let gameOver = false;
  let score = 0;

  // Input handling (keyboard arrow keys & A/D)
  const setKey = (e, down) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') player.moveLeft = down;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.moveRight = down;
  };
  window.addEventListener('keydown', (e) => setKey(e, true));
  window.addEventListener('keyup', (e) => setKey(e, false));

  // Touch / click to boost movement (optional)
  canvas.addEventListener('pointerdown', () => { player.speed = 8; playBoost(); });
  canvas.addEventListener('pointerup', () => (player.speed = 5));

  // Spawn a new obstacle at a random x position
  const spawnObstacle = () => {
    const x = Math.random() * (width - obstacleConfig.w);
    const speed = obstacleConfig.minSpeed + Math.random() * (obstacleConfig.maxSpeed - obstacleConfig.minSpeed);
    obstacles.push({ x, y: -obstacleConfig.h, w: obstacleConfig.w, h: obstacleConfig.h, speed });
  };

  // Spawn a particle for effects
  const spawnParticle = (x, y) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 2 + 1,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.01,
    });
  };

    const x = Math.random() * (width - obstacleConfig.w);
    const speed = obstacleConfig.minSpeed + Math.random() * (obstacleConfig.maxSpeed - obstacleConfig.minSpeed);
    obstacles.push({ x, y: -obstacleConfig.h, w: obstacleConfig.w, h: obstacleConfig.h, speed });
  };

  // Simple rectangle collision detection
  const collides = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Game loop
  const update = (timestamp) => {
    if (gameOver) return;
    // Clear canvas with gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Update player position
    if (player.moveLeft) player.x = Math.max(0, player.x - player.speed);
    if (player.moveRight) player.x = Math.min(width - player.w, player.x + player.speed);

    // Draw player with gradient and rounded corners
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#0cf');
    playerGrad.addColorStop(1, '#06c');
    ctx.fillStyle = playerGrad;
    const r = 6; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // Spawn obstacles based on interval
    if (timestamp - lastSpawn > obstacleConfig.spawnInterval) {
      spawnObstacle();
      lastSpawn = timestamp;
    }

    // Update and draw obstacles with gradient and rounded corners
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      const obsGrad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w/4, o.x + o.w/2, o.y + o.h/2, o.w/2);
      obsGrad.addColorStop(0, '#ff7b7b');
      obsGrad.addColorStop(1, '#c40000');
      ctx.fillStyle = obsGrad;
      const r = 4;
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

      // Collision detection
      if (collides(player, o)) {
        gameOver = true;
        playCollision();
        // spawn burst particles on collision
        for (let p = 0; p < 12; p++) spawnParticle(o.x + o.w/2, o.y + o.h/2);
        break;
      }

      // Remove if off-screen (score and particle effect)
      if (o.y > height) {
        obstacles.splice(i, 1);
        score++;
        playScore();
        // small burst when obstacle passes
        for (let p = 0; p < 6; p++) spawnParticle(o.x + o.w/2, height);
      }
    }

    // Lose condition: obstacle reaches bottom after passing player
    if (!gameOver) {
      const passed = obstacles.some(o => o.y + o.h >= height);
      if (passed) gameOver = true;
    }

    // Draw game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    } else {
      // Continue loop
      requestAnimationFrame(update);
    }
  };

  // Start the loop
  requestAnimationFrame(update);
})();
