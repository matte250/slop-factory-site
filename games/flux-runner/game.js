// Simple canvas game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Set canvas size to match display size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const player = { x: 50, y: 50, size: 30, speed: 200 }; // speed pixels per second
  // Play a tone of given frequency (Hz) for duration (seconds)
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); // low volume
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // Play a short tone for each direction key
    const tones = {
      ArrowUp: 440,
      ArrowDown: 330,
      ArrowLeft: 550,
      ArrowRight: 660
    };
    if (tones[e.key]) playTone(tones[e.key], 0.05);
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  let lastTime = performance.now();
  function update(dt) {
    const prevX = player.x;
    const prevY = player.y;
    if (keys.ArrowUp) player.y -= player.speed * dt;
    if (keys.ArrowDown) player.y += player.speed * dt;
    if (keys.ArrowLeft) player.x -= player.speed * dt;
    if (keys.ArrowRight) player.x += player.speed * dt;
    // Keep within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
  }
  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#2e2e4f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player as a glowing circle
    const grad = ctx.createRadialGradient(
      player.x + player.size/2,
      player.y + player.size/2,
      player.size/4,
      player.x + player.size/2,
      player.y + player.size/2,
      player.size/2
    );
    grad.addColorStop(0, '#66ccff');
    grad.addColorStop(1, '#003366');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2, 0, Math.PI*2);
    ctx.fill();
  }
  function loop(now) {
    const dt = (now - lastTime) / 1000; // convert ms to seconds
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
