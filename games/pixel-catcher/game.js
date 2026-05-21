// Pixel Catcher game targeting canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set default size if not defined in HTML
  if (!canvas.width) canvas.width = 400;
  if (!canvas.height) canvas.height = 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCatch() { playTone(800, 0.1); }
  function playMiss() { playTone(200, 0.2); }
  function playGameOver() { playTone(100, 0.5); }

  const basket = { width: 80, height: 20, x: 0, y: 0, speed: 6, moveLeft: false, moveRight: false };
  basket.x = canvas.width / 2 - basket.width / 2;
  basket.y = canvas.height - basket.height - 10;

  const pixels = [];
  let score = 0, misses = 0, gameOver = false;
  let spawnCounter = 0, speedFactor = 1;

  // Input handling
  let audioInitialized = false;
  window.addEventListener('keydown', e => {
    if (!audioInitialized) {
      audioCtx.resume();
      audioInitialized = true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a') basket.moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') basket.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') basket.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') basket.moveRight = false;
  });

  function spawnPixel() {
    const size = 20;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 * speedFactor;
    pixels.push({ x, y, size, speed });
  }

  function update() {
    if (gameOver) return;
    // Move basket
    if (basket.moveLeft) basket.x -= basket.speed;
    if (basket.moveRight) basket.x += basket.speed;
    basket.x = Math.max(0, Math.min(canvas.width - basket.width, basket.x));

    // Spawn pixels
    spawnCounter++;
    if (spawnCounter > 60) { // approx 1 per second at 60fps
      spawnPixel();
      spawnCounter = 0;
    }

    // Update pixels
    for (let i = pixels.length - 1; i >= 0; i--) {
      const p = pixels[i];
      p.y += p.speed;
      // Catch detection
      if (
        p.y + p.size >= basket.y &&
        p.x + p.size > basket.x &&
        p.x < basket.x + basket.width
      ) {
        score++;
        playCatch();
        pixels.splice(i, 1);
        continue;
      }
      // Missed
      if (p.y > canvas.height) {
        misses++;
        playMiss();
        pixels.splice(i, 1);
        if (misses >= 3) {
          gameOver = true;
          playGameOver();
        }
      }
    }
    // Increase difficulty
    speedFactor += 0.001;
  }

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gradient background (dark to deep blue)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#111');
  bgGrad.addColorStop(1, '#001133');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper for rounded rectangle
  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  // Basket with rounded corners and subtle shadow
  ctx.fillStyle = '#4caf50';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  roundedRect(basket.x, basket.y, basket.width, basket.height, 6);
  // Reset shadow for later draws
  ctx.shadowColor = 'transparent';

  // Pixels with slight gradient and shadow
  pixels.forEach(p => {
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.size, p.y + p.size);
    grad.addColorStop(0, '#ffeb3b');
    grad.addColorStop(1, '#f57f17');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(255,255,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  // Reset shadow
  ctx.shadowColor = 'transparent';

  // HUD with improved styling
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(`Score: ${score}`, 12, 12);
  ctx.fillText(`Misses: ${misses}`, 12, 34);

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff5252';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  }
}

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
