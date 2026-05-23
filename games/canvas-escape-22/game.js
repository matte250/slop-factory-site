// Simple Canvas Escape game
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
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
  const playScore = () => playTone(440, 0.05);

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Player (circle)
  const player = {
    radius: 15,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speedX: 0,
    forwardSpeed: -2, // moves upward each frame
    color: '#0af',
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });
  // mouse move for convenience
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    player.x = mx;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });

  // Blocks (rectangles)
  const blocks = [];
  const blockSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  const spawnBlock = () => {
    const width = 50 + Math.random() * 100;
    const x = Math.random() * (canvas.width - width);
    const height = 20 + Math.random() * 30;
    blocks.push({ x, y: -height, width, height, speedY: 3 });
  };

  // Collision detection (circle-rect)
  const circleRectCollide = (c, r) => {
    const distX = Math.abs(c.x - r.x - r.width / 2);
    const distY = Math.abs(c.y - r.y - r.height / 2);
    if (distX > r.width / 2 + c.radius) return false;
    if (distY > r.height / 2 + c.radius) return false;
    if (distX <= r.width / 2) return true;
    if (distY <= r.height / 2) return true;
    const dx = distX - r.width / 2;
    const dy = distY - r.height / 2;
    return dx * dx + dy * dy <= c.radius * c.radius;
  };

  let score = 0;
  let prevScore = 0;
  let gameOver = false;

  const update = dt => {
    if (gameOver) return;
    // Update player position
    if (keys.ArrowLeft) player.x -= 5;
    if (keys.ArrowRight) player.x += 5;
    player.y += player.forwardSpeed;

    // Keep player within horizontal bounds
    if (player.x < player.radius) player.x = player.radius;
    if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;

    // Spawn blocks
    if (performance.now() - lastSpawn > blockSpawnInterval) {
      spawnBlock();
      lastSpawn = performance.now();
    }

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speedY;
      if (b.y > canvas.height) {
        blocks.splice(i, 1);
        continue;
      }
      if (circleRectCollide(player, b)) {
        playCollision();
        gameOver = true;
      }
    }

    // Lose if player falls off bottom
    if (player.y - player.radius > canvas.height) {
      gameOver = true;
    }

    // Score is distance traveled (pixels moved upward)
    const newScore = Math.max(score, Math.abs(player.y - (canvas.height - 30)));
    if (Math.floor(newScore) > Math.floor(score)) {
      playScore();
    }
    score = newScore;
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with radial gradient and glow
    ctx.shadowColor = 'rgba(0, 150, 255, 0.6)';
    ctx.shadowBlur = 12;
    const playerGradient = ctx.createRadialGradient(
      player.x - player.radius / 3,
      player.y - player.radius / 3,
      player.radius / 4,
      player.x,
      player.y,
      player.radius
    );
    playerGradient.addColorStop(0, '#fff');
    playerGradient.addColorStop(1, player.color);
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // reset shadow

    // Draw blocks with vertical gradient
    blocks.forEach(b => {
      const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
      blockGrad.addColorStop(0, '#f88');
      blockGrad.addColorStop(1, '#c44');
      ctx.fillStyle = blockGrad;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Draw score with subtle shadow
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.shadowColor = 'transparent';

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff6';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let lastTime = 0;
  const loop = timestamp => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
