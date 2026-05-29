// Simple canvas game targeting <canvas id="game"></canvas>
// Arrow keys move a circle within the canvas bounds.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const state = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    speed: 4,
    dx: 0,
    dy: 0,
  };

  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  // Handle keyboard input
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
      // Ensure audio context is running
      if (audioCtx.state === 'suspended') audioCtx.resume();
      keys[e.key] = true;
      // Play a short sound for each direction
      const freqMap = { ArrowUp: 440, ArrowDown: 330, ArrowLeft: 262, ArrowRight: 349 };
      playBeep(freqMap[e.key] || 400);
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
      keys[e.key] = false;
      e.preventDefault();
    }
  });

  }

  const state = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    speed: 4,
    dx: 0,
    dy: 0,
  };

  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  // Handle keyboard input
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
      keys[e.key] = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
      keys[e.key] = false;
      e.preventDefault();
    }
  });

  function update() {
    // Update velocity based on pressed keys
    state.dx = 0;
    state.dy = 0;
    if (keys.ArrowUp) state.dy = -state.speed;
    if (keys.ArrowDown) state.dy = state.speed;
    if (keys.ArrowLeft) state.dx = -state.speed;
    if (keys.ArrowRight) state.dx = state.speed;

    // Update position
    state.x += state.dx;
    state.y += state.dy;

    // Keep inside bounds and play sound on collision
    let collided = false;
    if (state.x - state.radius < 0) { state.x = state.radius; collided = true; }
    if (state.x + state.radius > canvas.width) { state.x = canvas.width - state.radius; collided = true; }
    if (state.y - state.radius < 0) { state.y = state.radius; collided = true; }
    if (state.y + state.radius > canvas.height) { state.y = canvas.height - state.radius; collided = true; }
    if (collided) playBeep(600);

    // Move stars downward for a subtle background effect
    const starSpeed = 0.3;
    for (const star of stars) {
      star.y += starSpeed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    }
  }

  function draw() {
    // Fill background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw player circle with radial gradient for richer look
    const grad = ctx.createRadialGradient(state.x, state.y, state.radius * 0.3, state.x, state.y, state.radius);
    grad.addColorStop(0, '#ffdd57');
    grad.addColorStop(1, '#e67e22');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
