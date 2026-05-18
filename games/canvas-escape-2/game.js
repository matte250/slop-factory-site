// Simple canvas game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };
  // Ensure audio context is running after a user interaction
  canvas.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });
  // Set canvas to full window size
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Square properties
  let x = 0;
  let y = canvas.height / 2 - 25;
  const size = 50;
  const speed = 200; // px per second

  const draw = (dt) => {
    // Draw gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#3b3b58');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw moving circle with radial gradient
    const radius = size / 2;
    const circleGrad = ctx.createRadialGradient(x + radius, y + radius, radius * 0.2, x + radius, y + radius, radius);
    circleGrad.addColorStop(0, '#ffdd57');
    circleGrad.addColorStop(1, '#ff9f00');
    ctx.fillStyle = circleGrad;
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = (now - last) / 1000; // seconds
    last = now;
    x += speed * dt;
    if (x > canvas.width) {
    x = -size;
    playBeep();
  }
    draw(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
