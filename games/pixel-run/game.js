// Simple game that moves a glowing circle with arrow keys on the canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playMoveSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 440; // A4
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
  const state = { x: 50, y: 50, radius: 20, speed: 3 };
  const particles = []; // particle trail objects
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // Play sound for movement keys only
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) playMoveSound();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  function update() {
    if (keys['ArrowUp']) state.y -= state.speed;
    if (keys['ArrowDown']) state.y += state.speed;
    if (keys['ArrowLeft']) state.x -= state.speed;
    if (keys['ArrowRight']) state.x += state.speed;
    // Keep inside canvas
    state.x = Math.max(state.radius, Math.min(canvas.width - state.radius, state.x));
    state.y = Math.max(state.radius, Math.min(canvas.height - state.radius, state.y));
    // Add particle at current position
    particles.push({ x: state.x, y: state.y, life: 1 });
    // Update particles (fade out)
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].life -= 0.02;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }
  function draw() {
    // Background gradient (dark to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#001044');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw particle trail
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw moving glowing circle with radial gradient
    const grad = ctx.createRadialGradient(
      state.x,
      state.y,
      state.radius * 0.2,
      state.x,
      state.y,
      state.radius
    );
    grad.addColorStop(0, '#fffd75'); // bright center
    grad.addColorStop(1, '#ff4500'); // outer edge
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
    ctx.fill();
    // Reset shadow for future draws
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // Ensure canvas has size if not set via HTML/CSS
  if (!canvas.width) canvas.width = 400;
  if (!canvas.height) canvas.height = 300;
  loop();
})();
