// Simple canvas game: move a square with arrow keys
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  const player = { x: 50, y: 50, size: 20, speed: 2 };
  const keys = {};
  window.addEventListener('keydown', e=>{ keys[e.key] = true; playTone(); });
  window.addEventListener('keyup', e=>{ keys[e.key] = false; });
  function update(){
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
  }
  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1e3c72');
    bgGrad.addColorStop(1, '#2a5298');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // player as a circle with radial gradient
    const radGrad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 4,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    radGrad.addColorStop(0, '#ffdd57');
    radGrad.addColorStop(1, '#ff6f61');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // start when canvas is ready
  if (canvas.width && canvas.height) loop();
  else { canvas.addEventListener('load', loop); }
})();
