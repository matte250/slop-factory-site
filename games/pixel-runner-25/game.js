// Simple canvas game: move a circle with arrow keys
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const player = { x: width/2, y: height/2, r: 15, speed: 4 };
  // Simple particle system for visual flair
  const particles = [];
  const particleCount = 30;
  for(let i=0;i<particleCount;i++){
    particles.push({
      x: Math.random()*width,
      y: Math.random()*height,
      r: Math.random()*3 + 1,
      alpha: Math.random()*0.5 + 0.5,
      color: 'rgba(255,255,255,'+ (Math.random()*0.5+0.5) +')',
      vx: (Math.random()-0.5)*0.5,
      vy: (Math.random()-0.5)*0.5
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  const keys = {};
  window.addEventListener('keydown', e=>{ if(audioCtx.state === 'suspended') audioCtx.resume(); keys[e.key] = true; playBeep(); });
  window.addEventListener('keyup', e=>{ keys[e.key] = false; });
  function update(){
    // Move player with arrow keys
    if(keys['ArrowUp']) player.y -= player.speed;
    if(keys['ArrowDown']) player.y += player.speed;
    if(keys['ArrowLeft']) player.x -= player.speed;
    if(keys['ArrowRight']) player.x += player.speed;
    // keep player inside canvas
    player.x = Math.max(player.r, Math.min(width-player.r, player.x));
    player.y = Math.max(player.r, Math.min(height-player.r, player.y));

    // Update particles for subtle background motion
    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      // Wrap around edges
      if(p.x < 0) p.x += width;
      if(p.x > width) p.x -= width;
      if(p.y < 0) p.y += height;
      if(p.y > height) p.y -= height;
    }
  }
  function draw(){
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0,0,width,height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003f7f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);

    // Draw particles
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw player with radial gradient
    const grad = ctx.createRadialGradient(
      player.x, player.y, player.r*0.2,
      player.x, player.y, player.r
    );
    grad.addColorStop(0, '#00aaff');
    grad.addColorStop(1, '#001144');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
    ctx.fill();
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
