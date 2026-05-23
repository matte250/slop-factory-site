// Simple canvas game: move a square with arrow keys
(function() {
  // Get canvas and context
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions (fallback if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Player state
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(){
    // Ensure context is resumed (required after user interaction)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height / 2 - 15,
    size: 30,
    speed: 4,
    color: '#ff5722'
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play sound on movement keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
      playBeep();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Keep player within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
  }

  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player as a circle with radial gradient
    const radGrad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 4,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    radGrad.addColorStop(0, '#ff8a50');
    radGrad.addColorStop(1, '#ff5722');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
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
