// Simple Star Catcher game targeting canvas with id="game"
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCatch = () => playTone(800, 0.1);
  const playMiss = () => playTone(200, 0.2);
  const playGameOver = () => playTone(100, 0.5);
  // Ensure audio context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  document.addEventListener('keydown', resumeAudio);
  document.addEventListener('click', resumeAudio);
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Basket
  const basket = {
    w: 80,
    h: 20,
    x: width / 2 - 40,
    y: height - 30,
    speed: 6,
    moveLeft: false,
    moveRight: false,
  };

  // Stars
  const stars = [];
  let starSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let starSpeed = 2;
  let score = 0;
  let missed = 0;

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') basket.moveLeft = true;
    if (e.key === 'ArrowRight') basket.moveRight = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') basket.moveLeft = false;
    if (e.key === 'ArrowRight') basket.moveRight = false;
  });

  function spawnStar() {
    const size = 20;
    stars.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
    });
  }

  function update(dt) {
    // Move basket
    if (basket.moveLeft) basket.x = Math.max(0, basket.x - basket.speed);
    if (basket.moveRight) basket.x = Math.min(width - basket.w, basket.x + basket.speed);

    // Spawn stars
    if (Date.now() - lastSpawn > starSpawnInterval) {
      spawnStar();
      lastSpawn = Date.now();
    }

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += starSpeed;
      // Check catch
      if (
        s.y + s.size >= basket.y &&
        s.x + s.size > basket.x &&
        s.x < basket.x + basket.w
      ) {
        score++; playCatch();
        // Increase speed every 5 points
        if (score % 5 === 0) starSpeed += 0.5;
        stars.splice(i, 1);
        continue;
      }
      // Missed
      if (s.y > height) {
        missed++; playMiss();
        stars.splice(i, 1);
        if (missed >= 3) {
          // Game over
            playGameOver(); alert(`Game over! Score: ${score}`);
          // Reset state
          score = 0;
          missed = 0;
          stars.length = 0;
          starSpeed = 2;
        }
      }
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Reset fill style for later drawings
    ctx.fillStyle = '#555';
    // Draw basket with rounded corners and shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    const drawRoundedRect = (x, y, w, h, r) => {
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
    };
    ctx.fillStyle = '#555';
    drawRoundedRect(basket.x, basket.y, basket.w, basket.h, 8);
    // Draw stars with radial gradient for sparkle
    stars.forEach(s => {
      const gradStar = ctx.createRadialGradient(
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size * 0.1,
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size / 2
      );
      gradStar.addColorStop(0, 'rgba(255,255,200,0.9)');
      gradStar.addColorStop(1, 'rgba(255,215,0,0.3)');
      ctx.fillStyle = gradStar;
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Missed: ${missed}`, 10, 40);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
