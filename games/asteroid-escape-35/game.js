// Simple canvas game targeting <canvas id="game"></canvas>
// Use arrow keys to move a square.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep() {
    // Create a short beep sound
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
  const state = { x: 50, y: 50, size: 30, speed: 2 };
  const keys = {};
  function update() {
    if (keys.ArrowUp) state.y -= state.speed;
    if (keys.ArrowDown) state.y += state.speed;
    if (keys.ArrowLeft) state.x -= state.speed;
    if (keys.ArrowRight) state.x += state.speed;
    // keep inside canvas
    state.x = Math.max(0, Math.min(canvas.width - state.size, state.x));
    state.y = Math.max(0, Math.min(canvas.height - state.size, state.y));
  }
  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw player with shadow and rounded corners
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffcc00';
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(state.x + radius, state.y);
    ctx.lineTo(state.x + state.size - radius, state.y);
    ctx.quadraticCurveTo(state.x + state.size, state.y, state.x + state.size, state.y + radius);
    ctx.lineTo(state.x + state.size, state.y + state.size - radius);
    ctx.quadraticCurveTo(state.x + state.size, state.y + state.size, state.x + state.size - radius, state.y + state.size);
    ctx.lineTo(state.x + radius, state.y + state.size);
    ctx.quadraticCurveTo(state.x, state.y + state.size, state.x, state.y + state.size - radius);
    ctx.lineTo(state.x, state.y + radius);
    ctx.quadraticCurveTo(state.x, state.y, state.x + radius, state.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    // Score display
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('Use arrows to move', 10, 20);
  }
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play a short beep on arrow keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      playBeep();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  // Adjust canvas size to fill parent if not set
  if (!canvas.width) canvas.width = canvas.offsetWidth;
  if (!canvas.height) canvas.height = canvas.offsetHeight;
  loop();
})();
