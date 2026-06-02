// Neon Runner – enhanced graphics
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // particle system for jump effect
  const particles = [];
  function emitParticle(x, y) {
    particles.push({x, y, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2 - 1, life: 30});
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  const player = {x:50, y:H-30, w:20, h:20, vy:0, gravity:0.6, jump:-12, onGround:true};
  const obstacles = [];
  let frame = 0, score = 0, running = true;

  function spawn(){
    const gap = 100 + Math.random()*200;
    obstacles.push({x:W, w:20, h:30+Math.random()*40, gap});
  }

  function update(){
    if(!running) return;
    frame++;
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if(player.y + player.h >= H){
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles move
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= 4;
      // collision
if(player.x < o.x+o.w && player.x+player.w > o.x &&
          player.y+player.h > H - o.gap && player.y < H){
        running = false;
        // play crash sound
        playTone(220, 0.3);
      }
      if(o.x+o.w < 0) obstacles.splice(i,1);
    }
    // particle updates
    updateParticles();
    if(frame%120===0) spawn();
    score = Math.floor(frame/10);
  }

  function draw(){
    // background gradient
    const bg = ctx.createLinearGradient(0,0,W,0);
    bg.addColorStop(0,'#001');
    bg.addColorStop(1,'#020');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);
    // ground with neon glow
    ctx.fillStyle = '#111';
    ctx.fillRect(0,H-10,W,10);
    // particles (jump effect)
    ctx.fillStyle = '#0ff';
    particles.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fill();
    });
    // player with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // obstacles with glow
    ctx.shadowColor = '#f00';
    ctx.fillStyle = '#f00';
    obstacles.forEach(o=>{
      ctx.fillRect(o.x, H - o.gap, o.w, o.gap);
    });
    // reset shadow
    ctx.shadowBlur = 0;
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: '+score, 10,20);
    if(!running){
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', W/2-60, H/2);
    }
  }

  function loop(){
    update();
    draw();
    if(running) requestAnimationFrame(loop);
  }

  function jump(){
    if(player.onGround){
      player.vy = player.jump;
      player.onGround = false;
      // emit particles at player's position
      emitParticle(player.x + player.w/2, player.y + player.h/2);
      // play jump sound
      playTone(440, 0.1); // A4 short tone
    }
  }

    // input handling (resume AudioContext on first interaction)
    document.addEventListener('keydown', e=>{if(e.code==='Space'){audioCtx.resume(); jump();}});
    canvas.addEventListener('pointerdown', e=>{audioCtx.resume(); jump();});

  spawn();
  loop();
})();
