// Simple canvas game targeting <canvas id="game">.
// Arrow keys move a red square.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const state = { x: 50, y: 50, size: 30, speed: 2 };

  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play a tone on movement keys
    const freqMap = {
      ArrowUp: 440,
      ArrowDown: 220,
      ArrowLeft: 330,
      ArrowRight: 550,
    };
    if (freqMap[e.key]) playTone(freqMap[e.key]);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function playTone(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  function update() {
    if (keys.ArrowUp) state.y -= state.speed;
    if (keys.ArrowDown) state.y += state.speed;
    if (keys.ArrowLeft) state.x -= state.speed;
    if (keys.ArrowRight) state.x += state.speed;
    // Keep inside canvas, play bounce sound on collision
    const prevX = state.x;
    const prevY = state.y;
    state.x = Math.max(0, Math.min(canvas.width - state.size, state.x));
    state.y = Math.max(0, Math.min(canvas.height - state.size, state.y));
    if (state.x !== prevX || state.y !== prevY) {
      // Play a low tone for wall hit
      playTone(110);
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // player gradient circle
    const grad = ctx.createRadialGradient(state.x + state.size/2, state.y + state.size/2, 0, state.x + state.size/2, state.y + state.size/2, state.size/2);
    grad.addColorStop(0, '#ff8');
    grad.addColorStop(1, '#f44');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(state.x + state.size/2, state.y + state.size/2, state.size/2, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // Start animation when canvas is ready (size may be set via CSS/attributes)
  if (canvas.width && canvas.height) {
    loop();
  } else {
    // Wait for layout
    window.addEventListener('load', () => {
      // Ensure canvas has dimensions; fallback to 400x400
      canvas.width = canvas.width || 400;
      canvas.height = canvas.height || 400;
      loop();
    });
  }
})();
