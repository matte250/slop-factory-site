// Falling Stars Game – minimal implementation
// Canvas with id "game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set a default size if not defined in HTML/CSS
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  const paddle = {
    width: 100,
    height: 10,
    x: canvas.width / 2 - 50,
    y: canvas.height - 20,
    color: '#0095DD',
  };

  let stars = [];
  const starRadius = 8;
  let score = 0;
  let misses = 0;
  const maxMisses = 3;
  let running = true;

  // Mouse control – simple horizontal follow
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddle.x = mouseX - paddle.width / 2;
    // Clamp within canvas
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
  });

  // Create a new star at a random x position
  function spawnStar() {
    const x = Math.random() * (canvas.width - starRadius * 2) + starRadius;
    const speed = 2 + Math.random() * 2; // 2–4 px per frame
    stars.push({ x, y: -starRadius, speed });
  }

  const spawnInterval = setInterval(() => {
    if (running) spawnStar();
  }, 800);

  function drawPaddle() {
    // Rounded paddle with gradient
    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, '#33a');
    grad.addColorStop(1, '#0095DD');
    ctx.fillStyle = grad;
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawStars() {
    stars.forEach((s) => {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, starRadius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, '#FFD700');
      grad.addColorStop(1, '#ffaa00');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,200,50,0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, starRadius, 0, Math.PI * 2);
      ctx.fill();
      // Reset shadow for other drawings
      ctx.shadowBlur = 0;
    });
  }

  function updateStars() {
    stars = stars.filter((s) => {
      s.y += s.speed;
      // Check catch
if (
          s.y + starRadius >= paddle.y &&
          s.x >= paddle.x &&
          s.x <= paddle.x + paddle.width
        ) {
          score++;
          // Play catch sound (high tone)
          playTone(800, 0.1);
          return false; // remove caught star
        }
      // Missed star
if (s.y - starRadius > canvas.height) {
          misses++;
          // Play miss sound (low tone)
          playTone(200, 0.2);
          return false;
        }
      return true; // keep star
    });
  }

  function drawInfo() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Misses: ${misses}/${maxMisses}`, 10, 40);
    ctx.shadowBlur = 0;
  }

  function endGame() {
    running = false;
    clearInterval(spawnInterval);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFF';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  }

  function loop() {
    if (!running) return;
    // Draw gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateStars();
    drawStars();
    drawPaddle();
    drawInfo();
    if (misses >= maxMisses) {
      endGame();
      return;
    }
    requestAnimationFrame(loop);
  }

  // Start the game
  loop();
})();
