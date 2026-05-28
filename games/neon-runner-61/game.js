// Simple endless runner for canvas#game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 200;
  const groundY = H-30;
  const player = {x:50, y:groundY, r:10, vy:0, onGround:true};
  const gravity = 0.5, jumpVel = -10;
  const obstacles = [];
  const playerTrail = [];
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur/1000);
    osc.start(now);
    osc.stop(now + dur/1000);
  }
const stars = [];
for(let i=0;i<50;i++){
  stars.push({x: Math.random()*W, y: Math.random()*groundY, r: Math.random()*2+1});
}
  let speed = 2, spawnTimer=0, gameOver=false;

  function reset(){
    player.y=groundY; player.vy=0; player.onGround=true;
    obstacles.length=0; speed=2; spawnTimer=0; gameOver=false;
    playerTrail.length=0;
    loop();
  }

  function spawn(){
    const w=20+Math.random()*30;
    const h=20+Math.random()*30;
    obstacles.push({x:W, y:groundY-h, w, h});
  }

  function update(){
    // add trail point
    playerTrail.push({x:player.x, y:player.y, alpha:1});
    // fade trail
    for(let i=playerTrail.length-1;i>=0;i--){
      playerTrail[i].alpha-=0.03;
      if(playerTrail[i].alpha<=0) playerTrail.splice(i,1);
    }
    if(gameOver) return;
    // player physics
    player.vy+=gravity;
    player.y+=player.vy;
    if(player.y>=groundY){ player.y=groundY; player.vy=0; player.onGround=true; }
    else player.onGround=false;
    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x-=speed;
      if(o.x+o.w<0) obstacles.splice(i,1);
    }
    // spawn logic
    spawnTimer+=16.67; // approx ms per frame
    if(spawnTimer>1500){ spawn(); spawnTimer=0; }
    // increase speed gradually
    speed+=0.001;
    // collision
    for(const o of obstacles){
      const dx = Math.abs(player.x - (o.x+o.w/2));
      const dy = Math.abs(player.y - (o.y+o.h/2));
      if(dx < player.r + o.w/2 && dy < player.r + o.h/2){ gameOver=true; playTone(150,300); break; }
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0,0,0,groundY);
    skyGrad.addColorStop(0,'#001d3d');
    skyGrad.addColorStop(1,'#003566');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,groundY);
    // stars background
    ctx.fillStyle='white';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    // ground with subtle gradient
    const groundGrad = ctx.createLinearGradient(0,groundY,0,H);
    groundGrad.addColorStop(0,'#111');
    groundGrad.addColorStop(1,'#333');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0,groundY, W, H-groundY);
    // player
    // player with neon glow
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.r*0.2, player.x, player.y, player.r*2);
    playerGrad.addColorStop(0,'rgba(0,255,255,0.8)');
    playerGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor='cyan';
    ctx.shadowBlur=10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
    // draw trail
    for(const t of playerTrail){
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = 'rgba(0,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, player.r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // obstacles with neon glow
    ctx.shadowColor='magenta';
    ctx.shadowBlur=8;
    for(const o of obstacles){
      const grad = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
      grad.addColorStop(0,'rgba(255,0,255,0.7)');
      grad.addColorStop(1,'rgba(150,0,200,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.shadowBlur=0;
if(gameOver){
    ctx.fillStyle='white';
    ctx.font='30px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over – Click to Restart', W/2, H/2);
  } else {
    // speed HUD
    ctx.fillStyle='white';
    ctx.font='14px sans-serif';
    ctx.textAlign='left';
    ctx.fillText('Speed: '+speed.toFixed(2), 10, 20);
  }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  canvas.addEventListener('click',()=>{ // ensure audio context active
    audioCtx.resume();
    if(gameOver){ reset(); return; }
    if(player.onGround){ player.vy=jumpVel; playTone(300,150); }
  });
  // start
  loop();
})();
