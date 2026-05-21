// Simple canvas game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  // Set canvas size (optional, could be set via HTML/CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Game state: a bouncing ball
  let x = canvas.width / 2;
  let y = canvas.height / 2;
  let vx = 2.5;
  let vy = 2.0;
  const radius = 15;

  function update() {
    x += vx;
    y += vy;
    // Bounce off walls with sound
    if (x + radius > canvas.width || x - radius < 0) {
      vx = -vx;
      playBounce();
    }
    if (y + radius > canvas.height || y - radius < 0) {
      vy = -vy;
      playBounce();
    }
  }

  // Simple beep using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBounce() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }

  function draw() {
    // Fade previous frame for motion trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw ball with gradient and shadow
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, '#ff5722');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    // Reset shadow for other drawings
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the animation
  requestAnimationFrame(loop);
})();
