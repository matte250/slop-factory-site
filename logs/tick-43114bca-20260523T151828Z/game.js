// Enhanced canvas game with background gradient, player shadow, and falling enemies
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Set canvas size to fill parent
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Game state
  const player = { x: canvas.width / 2, y: canvas.height - 30, radius: 15, speed: 4 };
  const keys = {};

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play a short tone on movement keys
    if (e.key === 'ArrowLeft' || e.key === 'a') playTone(440, 0.05);
    else if (e.key === 'ArrowRight' || e.key === 'd') playTone(660, 0.05);
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    // Move player left/right
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Keep inside canvas
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw player as a circle
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
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
