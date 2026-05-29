// Simple canvas game targeting <canvas id="game"></canvas>
// Enhanced graphics: gradient ball, shadow, and fading trails
// Added simple bounce sound using Web Audio API
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Set up Web Audio for bounce sound
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  document.addEventListener('click', resumeAudio, { once: true });

  function playBounceSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  let x = width / 2,
      y = height / 2,
      vx = 2,
      vy = 3,
      radius = 15,
      hue = 0; // for color cycling

  // Create a radial gradient for the ball each frame for a shiny look
  function drawBall() {
    const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    gradient.addColorStop(0, `hsl(${hue}, 80%, 80%)`);
    gradient.addColorStop(1, `hsl(${hue}, 80%, 40%)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    // Fade previous frame for trailing effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    drawBall();
    ctx.restore();
  }

  function update() {
    x += vx;
    y += vy;
    // bounce off walls with sound
    let bounced = false;
    if (x + radius > width || x - radius < 0) { vx = -vx; bounced = true; }
    if (y + radius > height || y - radius < 0) { vy = -vy; bounced = true; }
    if (bounced) playBounceSound();
    // cycle hue for color change on each frame
    hue = (hue + 1) % 360;
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the animation when the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
