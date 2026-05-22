// Enhanced Shadow Runner graphics
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  const player = {x:W/2, y:H/2, r:5, speed:3};
  let lightRadius = 100;           // protective light
  const lightShrink = 0.03;       // per frame

  const darks = [];
  const crystals = [];
  const maxDarks = 8;
  const maxCrystals = 3;
  let score = 0;
  let gameOver = false;
  let gameOverSoundPlayed = false;

  function rand(min,max){return Math.random()*(max-min)+min;}
  function addDark(){
    const r = rand(15,30);
    darks.push({x:rand(r,W-r), y:rand(r,H-r), r, vx:rand(-1,1), vy:rand(-1,1)});
  }
  function addCrystal(){
    const r = 4;
    crystals.push({x:rand(r,W-r), y:rand(r,H-r), r});
  }
  for(let i=0;i<maxDarks;i++) addDark();
  for(let i=0;i<maxCrystals;i++) addCrystal();

  function update(){
    // player movement (arrow keys)
    if(keys['ArrowUp']) player.y -= player.speed;
    if(keys['ArrowDown']) player.y += player.speed;
    if(keys['ArrowLeft']) player.x -= player.speed;
    if(keys['ArrowRight']) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(W, player.x));
    player.y = Math.max(0, Math.min(H, player.y));

    // update dark shapes
    darks.forEach(d=>{
      d.x += d.vx; d.y += d.vy;
      if(d.x<d.r||d.x>W-d.r) d.vx*=-1;
      if(d.y<d.r||d.y>H-d.r) d.vy*=-1;
    });
    // shrink light
    lightRadius -= lightShrink;
    if(lightRadius<=0) gameOver=true;
    // check collisions with darks (outside light radius optional)
    for(const d of darks){
      const dx=player.x-d.x, dy=player.y-d.y;
      if(Math.hypot(dx,dy)<player.r+d.r){
        gameOver=true;
        if(!gameOverSoundPlayed){
          playTone(200,300);
          gameOverSoundPlayed=true;
        }
        break;
      }
    }
    // collect crystals
    for(let i=crystals.length-1;i>=0;i--){
      const c=crystals[i];
        if(Math.hypot(player.x-c.x, player.y-c.y)<player.r+c.r){
          score++; crystals.splice(i,1);
          if(crystals.length<maxCrystals) addCrystal();
          // play collection sound
          playTone(800,150);
        }
    }
  }

  function draw(){
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#020212');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // light aura with radial gradient
    const lightGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, lightRadius);
    lightGrad.addColorStop(0, 'rgba(255,255,200,0.4)');
    lightGrad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.beginPath();
    ctx.arc(player.x,player.y,lightRadius,0,2*Math.PI);
    ctx.fillStyle = lightGrad;
    ctx.fill();
    // player
    ctx.beginPath();
    ctx.arc(player.x,player.y,player.r,0,2*Math.PI);
    ctx.fillStyle='yellow';
    ctx.fill();
    // dark shapes
    darks.forEach(d=>{
      ctx.beginPath();
      ctx.arc(d.x,d.y,d.r,0,2*Math.PI);
      ctx.fillStyle='rgba(20,20,20,0.9)';
      ctx.fill();
    });
    // crystals
    crystals.forEach(c=>{
      ctx.beginPath();
      ctx.arc(c.x,c.y,c.r,0,2*Math.PI);
      ctx.fillStyle='cyan';
      ctx.fill();
    });
    // score
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    // game over overlay
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='white';
      ctx.font='30px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }

  const keys={};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  function startAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
  window.addEventListener('keydown',e=>{ keys[e.key]=true; startAudio(); });
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function loop(){
    if(!gameOver){
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }
  loop();
})();
