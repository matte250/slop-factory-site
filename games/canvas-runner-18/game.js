// Simple canvas game targeting <canvas id="game">
// This implements a bouncing square animation.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its parent or default size
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBounceSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  const resize = () => {
    canvas.width = canvas.clientWidth || 800;
    canvas.height = canvas.clientHeight || 600;
  };
  window.addEventListener('resize', resize);
  resize();

  const square = {
    x: 50,
    y: 50,
    size: 40,
    vx: 2,
    vy: 3,
    color: '#ff6600'
  };

  function update() {
    square.x += square.vx;
    square.y += square.vy;
    // bounce off walls and play sound
    let bounced = false;
    if (square.x < 0 || square.x + square.size > canvas.width) {
      square.vx *= -1;
      bounced = true;
    }
    if (square.y < 0 || square.y + square.size > canvas.height) {
      square.vy *= -1;
      bounced = true;
    }
    if (bounced) playBounceSound();
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001848');
    bgGrad.addColorStop(1, '#004e92');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw square with shadow and rounded corners
    // Draw rotating rounded square with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    // Translate to square center for rotation
    const { x, y, size } = square;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const angle = Math.atan2(square.vy, square.vx);
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = square.color;
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + size - r, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + r);
    ctx.lineTo(x + size, y + size - r);
    ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
    ctx.lineTo(x + r, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
