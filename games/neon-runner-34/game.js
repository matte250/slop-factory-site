// Simple Neon Runner game implementation
(function(){
  const canvas = document.getElementById('game');

  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // Set neon glow style for all drawings
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 8;
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // Generate starfield
  const stars = [];
  for(let i=0;i<120;i++){
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      alpha: 0.5+Math.random()*0.5
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.setValueAtTime(30, audioCtx.currentTime);
  bgGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgOsc.start();

  // Game state
  let score = 0;
  let speed = 4;
  let running = true;

  // Player
  const player = {
    x: 80,
    y: H-80,
    w: 40,
    h: 40,
    vy: 0,
    jumpForce: -12,
    gravity: 0.6,
    sliding: false,
    slideTimer: 0,
    draw(){
      // Neon rounded hover‑board
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#06f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      const r = 8;
      ctx.moveTo(this.x + r, this.y);
      ctx.lineTo(this.x + this.w - r, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + r);
      ctx.lineTo(this.x + this.w, this.y + this.h - r);
      ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - r, this.y + this.h);
      ctx.lineTo(this.x + r, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - r);
      ctx.lineTo(this.x, this.y + r);
      ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
      ctx.closePath();
      ctx.fill();
    },
    update(){
      // apply gravity
      this.vy += this.gravity;
      this.y += this.vy;
      if(this.y + this.h >= H-40){ // ground
        this.y = H-40 - this.h;
        this.vy = 0;
      }
      // slide duration
      if(this.sliding){
        this.slideTimer--;
        if(this.slideTimer <= 0){
          this.sliding = false;
          this.h = 40; // restore height
        }
      }
    },
    jump(){ if(this.y + this.h >= H-40) this.vy = this.jumpForce; },
    slide(){ if(!this.sliding){ this.sliding = true; this.slideTimer = 20; this.h = 20; this.y = H-40 - this.h; } }
  };

  // Obstacles
  const obstacles = [];
  function spawnObstacle(){
    const types = ['spike','drone'];
    const type = types[Math.floor(Math.random()*types.length)];
    const size = type==='spike'?30:40;
    const obstacle = {
      x: W,
      y: H-40 - size,
      w: size,
      h: size,
      type,
        draw(){
          if(type==='spike'){
            // Neon spike triangle
            ctx.fillStyle = '#f0f';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.h);
            ctx.lineTo(this.x + this.w/2, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h);
            ctx.closePath();
            ctx.fill();
          } else {
            // Neon drone circle with gradient
            const grad = ctx.createRadialGradient(this.x + this.w/2, this.y + this.h/2, this.w*0.2, this.x + this.w/2, this.y + this.h/2, this.w/2);
            grad.addColorStop(0, '#ff0');
            grad.addColorStop(1, '#660');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w/2, 0, Math.PI*2);
            ctx.fill();
          }
        },
      update(){ this.x -= speed; }
    };
    obstacles.push(obstacle);
  }

  // Input handling
  document.addEventListener('keydown', e=>{
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if(e.code==='Space') { player.jump(); playTone(440,0.1); }
    else if(e.code==='ShiftLeft' || e.code==='ShiftRight') { player.slide(); playTone(300,0.1); }
  });
  canvas.addEventListener('click',()=>{ if (audioCtx.state === 'suspended') audioCtx.resume(); player.jump(); playTone(440,0.1); });

  // Main loop
  function loop(){
    if(!running) return;
    ctx.clearRect(0,0,W,H);
    // background: neon city sky gradient with stars
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle = '#0ff';
    for(const s of stars){
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // update and draw player
    player.update();
    player.draw();
    // spawn obstacles
    if(Math.random()<0.02) spawnObstacle();
    // update obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.update();
      o.draw();
      // collision
        if(o.x < player.x+player.w && o.x+o.w > player.x && o.y < player.y+player.h && o.y+o.h > player.y){
          running = false;
          // Game over sound
          playTone(150,0.5);
        }
      // remove off‑screen
      if(o.x+o.w < 0) obstacles.splice(i,1);
    }
    // score & speed
    score++;
    if(score%500===0) speed+=0.5;
    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    ctx.fillText('Score: '+score, 10,30);
    requestAnimationFrame(loop);
  }
  loop();
})();
