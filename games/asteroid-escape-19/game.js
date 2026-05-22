// Simple canvas game targeting <canvas id="game"></canvas>
// Arrow keys move a square; space resets.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Load simple sound effects using data URIs
  const moveSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short beep
  const resetSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short beep
  const state = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    speed: 4,
  };
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') {
      // reset position
      state.x = canvas.width / 2;
      state.y = canvas.height / 2;
      resetSound.currentTime = 0;
      resetSound.play();
    } else if (e.key.startsWith('Arrow')) {
      moveSound.currentTime = 0;
      moveSound.play();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });
  function update() {
    if (keys['ArrowUp']) state.y -= state.speed;
    if (keys['ArrowDown']) state.y += state.speed;
    if (keys['ArrowLeft']) state.x -= state.speed;
    if (keys['ArrowRight']) state.x += state.speed;
    // keep inside canvas
    state.x = Math.max(0, Math.min(canvas.width - state.size, state.x));
    state.y = Math.max(0, Math.min(canvas.height - state.size, state.y));
  }
  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw square with radial gradient
    const grad = ctx.createRadialGradient(
        state.x + state.size / 2,
        state.y + state.size / 2,
        state.size / 8,
        state.x + state.size / 2,
        state.y + state.size / 2,
        state.size / 2
    );
    grad.addColorStop(0, '#ffdd00');
    grad.addColorStop(1, '#ff7700');
    ctx.fillStyle = grad;
    ctx.fillRect(state.x, state.y, state.size, state.size);

    // Add a subtle outer glow
    ctx.strokeStyle = 'rgba(255,200,0,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(state.x - 2, state.y - 2, state.size + 4, state.size + 4);
  }
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // Adjust canvas for high‑DPI displays and fill parent
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.scale(dpr, dpr);
  loop();
})();
