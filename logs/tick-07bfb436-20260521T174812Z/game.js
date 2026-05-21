// Simple Color Chase game with enhanced graphics
// Canvas element with id "game" must exist in the HTML.

(() => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once:true});
  canvas.addEventListener('click', resumeAudio, {once:true});

  const playTone = (frequency, duration = 0.1, type = 'sine') => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };

  const playSuccess = () => playTone(440, 0.08, 'triangle'); // bright tone
  const playFailure = () => playTone(150, 0.3, 'sawtooth'); // low thump

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Full‑window canvas with high‑DPI support
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (canvas.clientWidth || window.innerWidth) * dpr;
    canvas.height = (canvas.clientHeight || window.innerHeight) * dpr;
    ctx.scale(dpr, dpr);
  };
  window.addEventListener('resize', resize);
  resize();

  const PLAYER_RADIUS = 15;
  const PLAYER_SPEED = 4;
  const SQUARE_SIZE = 30;
  const COLORS = ['red', 'blue'];

  const player = {
    x: canvas.width / 2,
    y: canvas.height - PLAYER_RADIUS - 10,
    radius: PLAYER_RADIUS,
    colorIndex: 0, // 0 -> red, 1 -> blue
  };

  let squares = [];
  let score = 0;
  let gameOver = false;
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 1000; // ms

  // Toggle player colour with Space bar or mouse click
  const toggleColor = () => {
    player.colorIndex = 1 - player.colorIndex;
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') toggleColor();
    if (e.code === 'ArrowLeft') player.x -= PLAYER_SPEED;
    if (e.code === 'ArrowRight') player.x += PLAYER_SPEED;
  });
  canvas.addEventListener('click', toggleColor);

  const spawnSquare = () => {
    const size = SQUARE_SIZE;
    const x = Math.random() * (canvas.width - size) + size / 2;
    squares.push({
      x,
      y: -size,
      size,
      speed: 2 + Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  };

  const rectCircleCollide = (rect, circle) => {
    const distX = Math.abs(circle.x - rect.x);
    const distY = Math.abs(circle.y - rect.y);
    if (distX > rect.size / 2 + circle.radius) return false;
    if (distY > rect.size / 2 + circle.radius) return false;
    if (distX <= rect.size / 2) return true;
    if (distY <= rect.size / 2) return true;
    const dx = distX - rect.size / 2;
    const dy = distY - rect.size / 2;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  };

  const update = (timestamp) => {
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Game Over! Score: ${score}`, canvas.width / 2, canvas.height / 2);
      return;
    }

    // Spawn squares
    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
      spawnSquare();
      lastSpawn = timestamp;
    }

    // Move squares
    squares.forEach(s => s.y += s.speed);

    // Collision detection & removal
    squares = squares.filter(s => {
      // Bottom loss
      if (s.y - s.size / 2 > canvas.height) {
        gameOver = true;
        return false;
      }
      // Collision with player
      const collided = rectCircleCollide({ x: s.x, y: s.y, size: s.size }, player);
      if (collided) {
        if (s.color === COLORS[player.colorIndex]) {
          score++;
          playSuccess();
          return false; // remove matched square
        } else {
          gameOver = true;
          playFailure();
          return false;
        }
      }
      return true;
    });

    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with radial gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.radius * 0.3,
      player.x, player.y, player.radius
    );
    const playerColor = COLORS[player.colorIndex];
    playerGrad.addColorStop(0, 'white');
    playerGrad.addColorStop(1, playerColor);
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Helper to draw rounded square
    const drawRoundedRect = (x, y, size, radius, fillStyle) => {
      ctx.save();
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.moveTo(x - size / 2 + radius, y - size / 2);
      ctx.lineTo(x + size / 2 - radius, y - size / 2);
      ctx.quadraticCurveTo(x + size / 2, y - size / 2, x + size / 2, y - size / 2 + radius);
      ctx.lineTo(x + size / 2, y + size / 2 - radius);
      ctx.quadraticCurveTo(x + size / 2, y + size / 2, x + size / 2 - radius, y + size / 2);
      ctx.lineTo(x - size / 2 + radius, y + size / 2);
      ctx.quadraticCurveTo(x - size / 2, y + size / 2, x - size / 2, y + size / 2 - radius);
      ctx.lineTo(x - size / 2, y - size / 2 + radius);
      ctx.quadraticCurveTo(x - size / 2, y - size / 2, x - size / 2 + radius, y - size / 2);
      ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    };

    // Squares with rounded corners
    squares.forEach(s => {
      drawRoundedRect(s.x, s.y, s.size, 4, s.color);
    });

    // Score overlay
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
})();
