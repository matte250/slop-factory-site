// Enhanced canvas game with starfield background, smoother graphics, and sound effects
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let moveSoundPlaying = false;
  function playMoveSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  // Ensure AudioContext is resumed on user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 300;

  // Player as a circle
  const player = { x: 50, y: 50, radius: 12, speed: 2, dx: 0, dy: 0 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Create a simple starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  function update() {
    // Update player velocity based on arrow keys
    player.dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    player.dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (player.dx && player.dy) {
      player.dx *= Math.SQRT1_2;
      player.dy *= Math.SQRT1_2;
    }
    // Play movement sound if moving
    if (player.dx !== 0 || player.dy !== 0) {
      playMoveSound();
    }
    player.x += player.dx * player.speed;
    player.y += player.dy * player.speed;
    // Keep player within canvas bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Move stars to create a scrolling effect
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.x = Math.random() * canvas.width;
        s.y = -s.size;
      }
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player with radial gradient for a glowing effect
    const pGrad = ctx.createRadialGradient(
      player.x, player.y, player.radius * 0.2,
      player.x, player.y, player.radius
    );
    pGrad.addColorStop(0, '#ff0');
    pGrad.addColorStop(1, '#f80');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the animation loop
  requestAnimationFrame(loop);
})();
