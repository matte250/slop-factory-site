// Simple Solar Slinger game
// Canvas with id="game" must exist in the HTML.
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // generate simple starfield
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({x: Math.random()*width, y: Math.random()*height, r: Math.random()*1.5+0.5});
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, dur)=>{
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur/1000);
  };
  // Ensure audio context starts after user interaction
  const resumeAudio = ()=>{ audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once:true});
  window.addEventListener('keydown', e=>{keys[e.key]=true; resumeAudio();}, {once:false});
  window.addEventListener('keyup', e=>keys[e.key]=false);

  // Player (drone)
  const player = {
    x: width/2,
    y: height/2,
    r: 12,
    speed: 2.5,
    angle: 0,
    energy: 100,
    color: '#FFD700'
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);
  // particles for thrust effect
  const particles = [];
  const spawnParticle = (x,y)=>{
    particles.push({x, y, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, life: 30});
  };

  // Utility
  const rand = (min,max)=>Math.random()*(max-min)+min;

  // Orbs (energy)
  const orbs = [];
  const spawnOrb =()=>{
    orbs.push({x:rand(20,width-20), y:rand(20,height-20), r:8, color:'#00FF00'});
  };
  for(let i=0;i<5;i++) spawnOrb();

  // Shadows (obstacles)
  const shadows = [];
  const spawnShadow =()=>{
    shadows.push({x:rand(0,width-30), y:rand(0,height-30), w:30, h:30, dx:rand(-1,1), dy:rand(-1,1), color:'#555555'});
  };
  for(let i=0;i<3;i++) spawnShadow();

  function update(){
    // Player movement
    let moved = false;
    if(keys['ArrowUp']||keys['w']){ player.y -= player.speed; moved = true; }
    if(keys['ArrowDown']||keys['s']){ player.y += player.speed; moved = true; }
    if(keys['ArrowLeft']||keys['a']){ player.x -= player.speed; moved = true; }
    if(keys['ArrowRight']||keys['d']){ player.x += player.speed; moved = true; }
    // Keep inside bounds
    player.x = Math.max(player.r, Math.min(width-player.r, player.x));
    player.y = Math.max(player.r, Math.min(height-player.r, player.y));
    // Thrust particles and sound
    if(moved){
      spawnParticle(player.x, player.y);
      playSound(250, 80); // subtle thrust tone
    }
    // Update particles
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if(p.life <= 0) particles.splice(i,1);
    }

    // Energy drain
    player.energy -= 0.05;
    if(player.energy<=0){ endGame('Out of energy'); }

    // Check orb collisions
    for(let i=orbs.length-1;i>=0;i--){
      const o=orbs[i];
      const dx=player.x-o.x, dy=player.y-o.y;
      if(Math.hypot(dx,dy)<player.r+o.r){
        player.energy = Math.min(100, player.energy+20);
        orbs.splice(i,1);
        spawnOrb();
        playSound(600, 150); // orb collect jingle
      }
    }

    // Move shadows and wrap
    shadows.forEach(s=>{
      s.x += s.dx;
      s.y += s.dy;
      if(s.x<0||s.x>width-s.w) s.dx*=-1;
      if(s.y<0||s.y>height-s.h) s.dy*=-1;
    });

    // Shadow collision
    for(const s of shadows){
      if(player.x+player.r> s.x && player.x-player.r< s.x+s.w &&
         player.y+player.r> s.y && player.y-player.r< s.y+s.h){
        endGame('Hit a shadow');
        return;
      }
    }
  }

  function draw(){
    ctx.clearRect(0,0,width,height);

    // Starfield background
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,width,height);
    ctx.save();
    ctx.fillStyle = '#FFF';
    stars.forEach(st=>{
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.restore();

    // Thrust particles (behind player)
    ctx.save();
    particles.forEach(p=>{
      const alpha = p.life/30;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,200,0,'+alpha+')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.restore();

    // Draw player with gradient and glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,215,0,0.7)';
    ctx.shadowBlur = 12;
    const grad = ctx.createRadialGradient(player.x, player.y, player.r*0.2, player.x, player.y, player.r);
    grad.addColorStop(0, '#FFF');
    grad.addColorStop(1, player.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Draw glowing orbs
    orbs.forEach(o=>{
      ctx.save();
      ctx.shadowColor = 'rgba(0,255,0,0.6)';
      ctx.shadowBlur = 8;
      const grad = ctx.createRadialGradient(o.x, o.y, o.r*0.2, o.x, o.y, o.r);
      grad.addColorStop(0, '#AFF');
      grad.addColorStop(1, o.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    // Draw shadows with soft edges
    shadows.forEach(s=>{
      ctx.save();
      ctx.shadowColor = 'rgba(80,80,80,0.6)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.restore();
    });

    // Energy bar with border
    ctx.fillStyle = '#000';
    ctx.fillRect(10,10, 104,14);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(10,10,104,14);
    ctx.fillStyle = '#0F0';
    ctx.fillRect(12,12, player.energy,10);
  }

  let gameOver = false;
  function endGame(msg){
    gameOver = true;
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#FFF';
    ctx.font='24px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over: '+msg, width/2, height/2);
  }

  function loop(){
    if(!gameOver){
      update();
      draw();
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
