// Simple canvas game: control a square with arrow keys
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const player = { x: width / 2 - 15, y: height / 2 - 15, size: 30, speed: 4 };
  const keys = {};

  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(){
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  }

  window.addEventListener('keydown', e => {
    if(!keys[e.key]){ // only on new press
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        playBeep();
      }
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));
  }

  function draw() {
    // Draw gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001122');
    bgGrad.addColorStop(1, '#004466');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw player as a circle with radial gradient
    const radius = player.size / 2;
    const grad = ctx.createRadialGradient(player.x + radius, player.y + radius, radius * 0.2, player.x + radius, player.y + radius, radius);
    grad.addColorStop(0, '#00ccff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x + radius, player.y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
