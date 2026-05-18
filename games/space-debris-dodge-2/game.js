// Simple canvas game targeting <canvas id="game">
// Moves a bouncing square around the canvas.
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBounceSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  // resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); document.removeEventListener('click', resumeAudio); document.removeEventListener('keydown', resumeAudio); };
  document.addEventListener('click', resumeAudio);
  document.addEventListener('keydown', resumeAudio);
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  // set canvas size to match its CSS size if not set
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const square = { x: 20, y: 20, size: 30, vx: 2, vy: 2, angle: 0, bounceTimer: 0 };

  function update() {
    square.x += square.vx;
    square.y += square.vy;
    // bounce off walls with visual pop effect
    let bounced = false;
    if (square.x < 0 || square.x + square.size > canvas.width) { square.vx *= -1; bounced = true; }
    if (square.y < 0 || square.y + square.size > canvas.height) { square.vy *= -1; bounced = true; }
    if (bounced) { square.bounceTimer = 10; playBounceSound(); } // frames for pop effect
    // rotate square
    square.angle += 0.05;
    // decrement pop timer
    if (square.bounceTimer > 0) square.bounceTimer--;
  }

  function draw() {
    // fade previous frame for motion trail
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw rotating square with gradient and bounce pop effect
    ctx.save();
    ctx.translate(square.x + square.size/2, square.y + square.size/2);
    // apply pop scaling on bounce
    if (square.bounceTimer > 0) {
      const scale = 1 + square.bounceTimer / 20;
      ctx.scale(scale, scale);
    }
    ctx.rotate(square.angle);
    const grad = ctx.createLinearGradient(-square.size/2, -square.size/2, square.size/2, square.size/2);
    grad.addColorStop(0, '#ff8a65');
    grad.addColorStop(1, '#d32f2f');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillRect(-square.size/2, -square.size/2, square.size, square.size);
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start animation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
