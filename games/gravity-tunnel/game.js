// Simple endless runner based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  // star field for background
  const starCount = 200;
  const stars = [];
  for(let i=0;i<starCount;i++){
    stars.push({x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, r: Math.random()*1.5+0.5});
  }
  // particles for player trail
  const particles = [];
  const maxParticles = 100;
  // sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if(!canvas) return; // no canvas
  const ctx = canvas.getContext('2d');
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  // player
  const radius = 15;
  let playerX = 100;
  let playerY = H/2;
  let velY = 0;
  const GRAV = 0.4;
  let gravity = GRAV;
  // tunnel generation
  const segmentLength = 5; // pixels per segment
  const tunnel = [];
  const tunnelWidth = 120; // vertical gap size
  let offsetX = 0;
  function generateSegment(){
    const lastTop = tunnel.length? tunnel[tunnel.length-1].top : H/2 - tunnelWidth/2 - 30;
    const delta = (Math.random()-0.5)*30; // random shift
    let newTop = lastTop + delta;
    newTop = Math.max(0, Math.min(H - tunnelWidth, newTop));
    tunnel.push({top:newTop, bottom:newTop + tunnelWidth});
    // keep only needed segments
    if(tunnel.length > Math.ceil(W/segmentLength)+2){
      tunnel.shift();
    }
    // subtle swoosh for new segment
    playTone(660,0.05);
  }
  // prefill
  for(let i=0;i<Math.ceil(W/segmentLength)+2;i++) generateSegment();
  // input
  canvas.addEventListener('click',()=>{gravity = -gravity; playTone(440,0.1);});
  // game loop
  let running = true;
  function update(){
    // move player
    velY += gravity;
    playerY += velY;
    // scroll tunnel
    offsetX += 2; // speed
    if(offsetX >= segmentLength){
      offsetX = 0;
      generateSegment();
    }
    // move stars to create parallax effect
    for(const s of stars){
      s.x -= 0.5; // slower than tunnel for depth
      if(s.x < 0) s.x = W;
    }
    // generate particle trail
    particles.push({x: playerX, y: playerY, alpha: 1, size: radius * 0.5});
    // update particles
    for(let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.alpha -= 0.02;
      p.size *= 0.96;
      if(p.alpha <= 0.05) particles.splice(i, 1);
    }
    // collision detection at player's x position
    const idx = Math.floor((playerX+offsetX)/segmentLength);
    const seg = tunnel[idx] || tunnel[tunnel.length-1];
    if(playerY - radius < seg.top || playerY + radius > seg.bottom){
      playTone(220,0.2);
      running = false;
    }
    // out of bounds vertically
    if(playerY - radius < 0 || playerY + radius > H){
      running = false;
    }
  }
  function draw(){
    // draw star field background first
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    // background gradient overlay for depth
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // tunnel walls gradient
    const wallGrad = ctx.createLinearGradient(0,0,W,0);
    wallGrad.addColorStop(0,'#333');
    wallGrad.addColorStop(1,'#999');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    // top wall
    ctx.moveTo(0,0);
    for(let i=0;i<tunnel.length;i++){
      const x = i*segmentLength - offsetX;
      ctx.lineTo(x, tunnel[i].top);
    }
    ctx.lineTo(W,0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    // bottom wall
    ctx.moveTo(0,H);
    for(let i=0;i<tunnel.length;i++){
      const x = i*segmentLength - offsetX;
      ctx.lineTo(x, tunnel[i].bottom);
    }
    ctx.lineTo(W,H);
    ctx.closePath();
    ctx.fill();
    // draw particles trail
    for(let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `rgba(255,200,0,${p.alpha})`);
      grad.addColorStop(1, `rgba(255,100,0,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
    // draw player with radial gradient
    const playerGrad = ctx.createRadialGradient(playerX, playerY, radius*0.2, playerX, playerY, radius);
    playerGrad.addColorStop(0,'#ffff80');
    playerGrad.addColorStop(1,'#ff8000');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(playerX, playerY, radius,0,Math.PI*2);
    ctx.fill();
  }
  function loop(){
    if(!running){
      ctx.font = '30px sans-serif';
      ctx.fillStyle = '#f00';
      ctx.fillText('Game Over', W/2-80, H/2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
