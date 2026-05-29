// Simple canvas game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  // Set canvas size to fill parent
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Game state
  const player = {x: 50, y: canvas.height/2, size: 20, speed: 2};
  const keys = {};
  // Input handling
  window.addEventListener('keydown',e=>{ keys[e.key]=true; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) playBeep(); });
  window.addEventListener('keyup',e=>keys[e.key]=false);
  function update(){
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width-player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height-player.size, player.y));
  }
  function draw(){
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0,'#1e1e2f');
    bgGrad.addColorStop(1,'#232633');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw player as a radial gradient circle
    const radGrad = ctx.createRadialGradient(
      player.x + player.size/2,
      player.y + player.size/2,
      player.size/8,
      player.x + player.size/2,
      player.y + player.size/2,
      player.size/2
    );
    radGrad.addColorStop(0,'#ffcc66');
    radGrad.addColorStop(1,'#ff8800');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2, 0, Math.PI*2);
    ctx.fill();
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
