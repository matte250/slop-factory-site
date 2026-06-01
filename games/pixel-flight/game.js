// Simple game on canvas with id "game"
// Arrow keys move a player square; press space to toggle color.
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Set up high‑DPI canvas (already handled above)
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 800;
  const height = canvas.clientHeight || 600;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Simple sound helper using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(frequency) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
  const player = { x: width/2, y: height/2, size: 30, speed: 4, color: 'blue' };
  const keys = {};
  let audioInitialized = false;
  document.addEventListener('keydown', e => {
    if (!audioInitialized) { audioCtx.resume(); audioInitialized = true; }
    keys[e.key] = true;
    if (e.key === ' ') {
      player.color = player.color === 'blue' ? 'red' : 'blue';
      playSound(660); // toggle sound
    } else if (e.key.startsWith('Arrow')) {
      playSound(440); // movement sound
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  function update(){
    if(keys['ArrowUp'])    player.y -= player.speed;
    if(keys['ArrowDown'])  player.y += player.speed;
    if(keys['ArrowLeft'])  player.x -= player.speed;
    if(keys['ArrowRight']) player.x += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));
  }
  function draw(){
    // Draw gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#1e3c72');
    bgGradient.addColorStop(1, '#2a5298');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    // Draw player as a circle with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    const radius = player.size / 2;
    ctx.arc(player.x + radius, player.y + radius, radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.restore();
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
