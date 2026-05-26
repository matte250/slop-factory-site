// Neon Escape game
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx=canvas.getContext('2d');
  // size canvas to fill parent
  function resize(){
    canvas.width=canvas.clientWidth;
    canvas.height=canvas.clientHeight;
  }
  window.addEventListener('resize',resize);
  resize();

  const player={x:0,y:0,size:20,color:'#0ff'};
  const bars=[];
  const barWidth=40; // fixed width
  const barSpeed=2; // pixels per frame
  const spawnInterval=1200; // ms
  let lastSpawn=0;
  let lastTime=0;
  let score=0;
  let running=true;

  // center player horizontally at bottom
  function reset(){
    player.x=canvas.width/2 - player.size/2;
    player.y=canvas.height - player.size - 10;
    bars.length=0;
    score=0;
    lastSpawn=0;
    lastTime=performance.now();
    running=true;
    // restart background tone
    stopBackground();
    startBackground();
    requestAnimationFrame(loop);
  }

  // input and sound init
  let audioCtx;
  function initAudio(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    }
  }
  function playTone(freq, dur){
    initAudio();
    // Ensure audio context is running
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur/1000);
    osc.start(now);
    osc.stop(now + dur/1000);
  }

  // background hum
  let bgOsc=null, bgGain=null;
  function startBackground(){
    if(bgOsc) return; // already playing
    initAudio();
    bgGain = audioCtx.createGain();
    bgGain.gain.value = 0.02; // subtle volume
    bgOsc = audioCtx.createOscillator();
    bgOsc.frequency.value = 60; // low hum
    bgOsc.type = 'sine';
    bgOsc.connect(bgGain);
    bgGain.connect(audioCtx.destination);
    bgOsc.start();
  }
  function stopBackground(){
    if(!bgOsc) return;
    bgOsc.stop();
    bgOsc.disconnect();
    bgGain.disconnect();
    bgOsc = null;
    bgGain = null;
  }
  document.addEventListener('keydown',e=>{
    // resume audio context on first user interaction
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if(e.key==='ArrowLeft'){
      player.x-=15;
      playTone(500,80);
    }
    if(e.key==='ArrowRight'){
      player.x+=15;
      playTone(500,80);
    }
    // keep inside bounds
    if(player.x<0) player.x=0;
    if(player.x+player.size>canvas.width) player.x=canvas.width-player.size;
  });

  function spawnBar(){
    const gap=80; // space between bars
    const x=Math.random()*(canvas.width-barWidth);
    bars.push({x,y:0,width:barWidth,height:20});
  }

  function loop(timestamp){
    if(!running) return;
    const dt=timestamp-lastTime;
    lastTime=timestamp;
    // update score
    score+=dt/1000;
    // spawn bars
    if(timestamp-lastSpawn>spawnInterval){
      spawnBar();
      lastSpawn=timestamp;
    }
    // move bars
    for(let i=bars.length-1;i>=0;i--){
      const b=bars[i];
      b.y+=barSpeed;
      // remove off-screen
      if(b.y>canvas.height) bars.splice(i,1);
    }
    // collision
    for(const b of bars){
      if(player.x < b.x + b.width &&
         player.x + player.size > b.x &&
         player.y < b.y + b.height &&
         player.y + player.size > b.y){
        running=false;
        // play collision sound
        playTone(150,200);
        alert('Game Over! Score: '+Math.floor(score)+'s');
        reset();
        return;
      }
    }
    // draw enhanced graphics
    // background gradient (dark neon)
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0,'#001020');
    bgGrad.addColorStop(1,'#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // neon grid lines with glow
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 5;
    for(let y=0; y<canvas.height; y+=30){
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(canvas.width,y);
      ctx.stroke();
    }
    for(let x=0; x<canvas.width; x+=30){
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.lineTo(x,canvas.height);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset blur for other elements

    // draw bars with neon glow
    bars.forEach(b => {
      const barGrad = ctx.createLinearGradient(0,b.y,b.width,b.y+b.height);
      barGrad.addColorStop(0,'#0f0');
      barGrad.addColorStop(1,'#060');
      ctx.fillStyle = barGrad;
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur = 8;
      ctx.fillRect(b.x,b.y,b.width,b.height);
    });
    ctx.shadowBlur = 0; // reset after bars

    // draw player with glow
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x,player.y,player.size,player.size);
    ctx.shadowBlur = 0;

    // draw score in neon font
    ctx.fillStyle = '#0ff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: '+Math.floor(score)+'s',10,30);
    requestAnimationFrame(loop);
  }
  reset();
})();
