// Simple canvas game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback if not set in HTML)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration * 1000);
  }
  // Ensure audio context resumes on first interaction
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }, {once: true});

  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 300;

  // Player state
  const player = { x: canvas.width / 2, y: canvas.height / 2, size: 20, speed: 2 };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; playTone(440); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
  }

  function drawBackground() {
    // Gradient background for better visuals
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

function drawPlayer() {
    // Draw player as a circle with radial gradient
    const radius = player.size / 2;
    const grad = ctx.createRadialGradient(
      player.x + radius,
      player.y + radius,
      radius * 0.2,
      player.x + radius,
      player.y + radius,
      radius
    );
    grad.addColorStop(0, '#66aaff');
    grad.addColorStop(1, '#0044aa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x + radius, player.y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
  }

function draw() {
    drawBackground();
    drawPlayer();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
