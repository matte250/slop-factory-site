// Simple canvas game targeting <canvas id="game"></canvas>
// A red square moves with arrow keys and bounces off the edges.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 300;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  // Ensure canvas has dimensions (fallback to 800x600)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const square = {x: 50, y: 50, size: 40, speedX: 2, speedY: 2, color: 'red'};
let angle = 0;
let particles = []; // {x, y, alpha}

  const keys = {ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false};

  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function update() {
    // Move square based on pressed arrows
    if (keys.ArrowUp) square.y -= square.speedY;
    if (keys.ArrowDown) square.y += square.speedY;
    if (keys.ArrowLeft) square.x -= square.speedX;
    if (keys.ArrowRight) square.x += square.speedX;
    // Bounce off walls
    if (square.x < 0) { square.x = 0; beep(); }
    if (square.y < 0) { square.y = 0; beep(); }
    if (square.x + square.size > canvas.width) { square.x = canvas.width - square.size; beep(); }
    if (square.y + square.size > canvas.height) square.y = canvas.height - square.size;
    // Create particle at square center
    particles.push({x: square.x + square.size/2, y: square.y + square.size/2, alpha: 1});
    // Update particles fade
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].alpha -= 0.02;
      if (particles[i].alpha <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001');
    gradient.addColorStop(1, '#004');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw rotating square
    ctx.save();
    ctx.translate(square.x + square.size / 2, square.y + square.size / 2);
    ctx.rotate(angle);
    ctx.fillStyle = square.color;
    ctx.fillRect(-square.size / 2, -square.size / 2, square.size, square.size);
    ctx.restore();
    // Draw particles
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1; // reset alpha
  }

  function loop() {
    update();
    draw();
    // Increment rotation angle
    angle += 0.02;
    requestAnimationFrame(loop);
  }

  // Start the animation loop when the document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else {
    loop();
  }
})();
