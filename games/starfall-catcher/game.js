// Simple Starfall Catcher game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size (you can adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Game parameters
  const basketWidth = 80;
  const basketHeight = 20;
  const basketSpeed = 6;
  const starRadius = 8;
  const bombRadius = 10;
  const spawnInterval = 1000; // ms
  const maxMisses = 5;

  // Game state
  const state = {
    score: 0,
    missed: 0,
    gameOver: false,
    basketX: canvas.width / 2 - basketWidth / 2,
    basketY: canvas.height - basketHeight - 10,
    stars: [],
    bombs: [],
    lastSpawn: 0,
    keys: { left: false, right: false },
  };

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCatch() { playTone(800); }
  function playBomb() { playTone(150, 0.3); }


  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') state.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') state.keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') state.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') state.keys.right = false;
  });

  // Helper: spawn a star or bomb
  function spawnObject() {
    const isBomb = Math.random() < 0.2; // 20% chance of bomb
    const x = Math.random() * (canvas.width - (isBomb ? bombRadius * 2 : starRadius * 2)) + (isBomb ? bombRadius : starRadius);
    const obj = { x, y: - (isBomb ? bombRadius : starRadius), dy: 2 + Math.random() * 2 };
    if (isBomb) state.bombs.push(obj); else state.stars.push(obj);
  }

  // Collision detection
  function rectCircleCollide(rx, ry, rw, rh, cx, cy, cr) {
    // Find closest point to circle within rectangle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  // Game loop
  function update(timestamp) {
    if (state.gameOver) {
      drawGameOver();
      return;
    }
    // Spawn objects
    if (timestamp - state.lastSpawn > spawnInterval) {
      spawnObject();
      state.lastSpawn = timestamp;
    }
    // Move basket
    if (state.keys.left) state.basketX = Math.max(0, state.basketX - basketSpeed);
    if (state.keys.right) state.basketX = Math.min(canvas.width - basketWidth, state.basketX + basketSpeed);

    // Update stars
    for (let i = state.stars.length - 1; i >= 0; i--) {
      const s = state.stars[i];
      s.y += s.dy;
      // Check catch
        if (rectCircleCollide(state.basketX, state.basketY, basketWidth, basketHeight, s.x, s.y, starRadius)) {
          state.score++;
          playCatch();
          state.stars.splice(i, 1);
          continue;
        }
      // Missed
      if (s.y - starRadius > canvas.height) {
        state.missed++;
        state.stars.splice(i, 1);
        if (state.missed >= maxMisses) {
          state.gameOver = true;
        }
      }
    }

    // Update bombs
    for (let i = state.bombs.length - 1; i >= 0; i--) {
      const b = state.bombs[i];
      b.y += b.dy;
      if (rectCircleCollide(state.basketX, state.basketY, basketWidth, basketHeight, b.x, b.y, bombRadius)) {
        playBomb();
        state.gameOver = true;
        break;
      }
      if (b.y - bombRadius > canvas.height) {
        state.bombs.splice(i, 1);
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#000022');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional subtle starfield background (static small stars)
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Draw basket with rounded corners
    ctx.fillStyle = '#654321';
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(state.basketX + radius, state.basketY);
    ctx.lineTo(state.basketX + basketWidth - radius, state.basketY);
    ctx.quadraticCurveTo(state.basketX + basketWidth, state.basketY, state.basketX + basketWidth, state.basketY + radius);
    ctx.lineTo(state.basketX + basketWidth, state.basketY + basketHeight);
    ctx.lineTo(state.basketX, state.basketY + basketHeight);
    ctx.lineTo(state.basketX, state.basketY + radius);
    ctx.quadraticCurveTo(state.basketX, state.basketY, state.basketX + radius, state.basketY);
    ctx.closePath();
    ctx.fill();

    // Draw stars with glowing gradient
    for (const s of state.stars) {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, starRadius);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, starRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw bombs with red glow
    for (const b of state.bombs) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, bombRadius);
      grad.addColorStop(0, 'rgba(255,0,0,0.9)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, bombRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI text with shadow for readability
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Missed: ${state.missed}/${maxMisses}`, 10, 40);
    ctx.shadowBlur = 0;
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 20);
  }

  // Start the loop
  requestAnimationFrame(update);
})();
