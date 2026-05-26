// Simple canvas game targeting <canvas id="game"></canvas>
// The player controls a blue square with arrow keys.
// The square moves within the canvas bounds and bounces off edges.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Play a short start tone when audio is resumed
    playSound(300, 0.2);
    canvas.removeEventListener('click', resumeAudio);
  };
  canvas.addEventListener('click', resumeAudio);

  // Helper to play a simple beep
  function playSound(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Set canvas size (fallback if not set in HTML/CSS)
  if (!canvas.width) canvas.width = 800;
  if (!canvas.height) canvas.height = 600;

  const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height / 2 - 15,
    size: 30,
    speed: 3,
    color: '#4287f5',
    dx: 0,
    dy: 0,
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function update() {
    // Update direction based on pressed keys
    const prevDx = player.dx;
    const prevDy = player.dy;
    player.dx = 0;
    player.dy = 0;
    if (keys.ArrowUp) player.dy = -player.speed;
    if (keys.ArrowDown) player.dy = player.speed;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;

    // Play movement sound when direction changes
    if (player.dx !== 0 || player.dy !== 0) {
      playSound(400, 0.05);
    }

    // Move player
    player.x += player.dx;
    player.y += player.dy;

    // Keep within bounds and play collision sound if clamped
    let collided = false;
    if (player.x < 0) { player.x = 0; collided = true; }
    if (player.y < 0) { player.y = 0; collided = true; }
    if (player.x + player.size > canvas.width) { player.x = canvas.width - player.size; collided = true; }
    if (player.y + player.size > canvas.height) { player.y = canvas.height - player.size; collided = true; }
    if (collided) {
      playSound(200, 0.1);
    }
  }

  function draw() {
    // Draw a subtle vertical gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player as a glowing circle
    const radius = player.size / 2;
    const gradient = ctx.createRadialGradient(
      player.x + radius,
      player.y + radius,
      radius * 0.2,
      player.x + radius,
      player.y + radius,
      radius
    );
    gradient.addColorStop(0, '#8ab6ff');
    gradient.addColorStop(1, player.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x + radius, player.y + radius, radius, 0, Math.PI * 2);
    ctx.fill();

    // Optional: add a soft shadow for depth
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.closePath();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
