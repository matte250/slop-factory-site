// Enhanced canvas game with smoother graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  let x = 0;
  const radius = 15;
  const speed = 3;

  // Initialize audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep() {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  }

  // Create a vertical gradient for the background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#111');
  bgGradient.addColorStop(1, '#333');

  // Create a radial gradient for the moving circle
  function circleGradient(xPos, yPos) {
    const grad = ctx.createRadialGradient(xPos, yPos, radius * 0.2, xPos, yPos, radius);
    grad.addColorStop(0, '#ffdd57');
    grad.addColorStop(1, '#ff8800');
    return grad;
  }

  function update() {
    x += speed;
    if (x - radius > width) {
      x = -radius;
      playBeep();
    }
  }

  function draw() {
    // Draw background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw moving circle with gradient and shadow
    const y = height / 2;
    ctx.save();
    ctx.fillStyle = circleGradient(x, y);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the animation loop when the page is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loop();
  } else {
    document.addEventListener('DOMContentLoaded', loop);
  }
})();
