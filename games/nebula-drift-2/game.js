// Nebula Drift – enhanced graphics
// Targets canvas with id="game"

(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;
  // starfield particles
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*2+0.5,
      speed: 0.2 + Math.random()*0.3,
      alpha: Math.random()*0.5+0.5
    });
  }

  const player = {x:80, y:H/2, r:12, speed:3};
  const keys = {};
  const obstacles = [];
  const powerups = [];
  let time = 30; // seconds
  let last = performance.now();
  let gameOver = false;
  // audio context
  const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  function playTone(freq,dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime+dur);
  }

  // input
  // resume audio context on first interaction
  window.addEventListener('keydown',e=>{ keys[e.key]=true; if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); });
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function spawnObstacle(){
    const size = 15+Math.random()*15;
    const angle = Math.random()*Math.PI*2;
    const rotSpeed = (Math.random()-0.5)*0.04; // radians per frame
    const hue = Math.floor(Math.random()*360);
    obstacles.push({x:W+size, y:Math.random()*H, w:size, h:size, v:2+player.speed*0.1, angle, rotSpeed, hue});
  }
  function spawnPowerup(){
    const size = 10;
    powerups.push({x:W+size, y:Math.random()*H, r:size, v:2+player.speed*0.1});
  }

  function rectHit(ax,ay,aw,ah,bx,by,bw,bh){
    return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
  }
  function circleHit(cx,cy,cr,ox,oy,ow,oh){
    // approximate by rect
    const closestX = Math.max(ox, Math.min(cx, ox+ow));
    const closestY = Math.max(oy, Math.min(cy, oy+oh));
    const dx=cx-closestX, dy=cy-closestY;
    return dx*dx+dy*dy<cr*cr;
  }

  function update(dt){
    if(gameOver) return;
    // player movement (up/down)
    if(keys['ArrowUp']) player.y-=player.speed;
    if(keys['ArrowDown']) player.y+=player.speed;
    player.y = Math.max(player.r, Math.min(H-player.r, player.y));

    // starfield motion
    for(let s of stars){
      s.x -= s.speed;
      if(s.x < 0){ s.x = W; s.y = Math.random()*H; }
    }

    // spawn obstacles/powerups
    if(Math.random()<0.02) spawnObstacle();
    if(Math.random()<0.005) spawnPowerup();

    // move obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x-=o.v;
      if(o.x+o.w<0) obstacles.splice(i,1);
      else if(circleHit(player.x,player.y,player.r,o.x,o.y,o.w,o.h)){
        playTone(200,0.3); // collision sound
        gameOver=true; break;
      }
    }
    // move powerups
    for(let i=powerups.length-1;i>=0;i--){
      const p=powerups[i];
      p.x-=p.v;
      if(p.x+p.r<0) powerups.splice(i,1);
      else if(circleHit(player.x,player.y,player.r,p.x,p.y,p.r,p.r)){
        playTone(600,0.2); // power‑up collect
        time+=5; // extend timer
        player.speed+=0.5; // boost speed
        powerups.splice(i,1);
      }
    }

    // timer
    time -= dt/1000;
    if(time<=0) gameOver=true;
  }

  function draw(){
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,'#001030');
    bgGrad.addColorStop(1,'#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // starfield particles (twinkling)
    ctx.save();
    for(let s of stars){
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
      // simple twinkle effect
      s.alpha += (Math.random()-0.5)*0.02;
      if(s.alpha>0.9) s.alpha=0.9;
      if(s.alpha<0.3) s.alpha=0.3;
    }
    ctx.restore();
    // player ship – glowing triangle
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffcc';
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(player.x+player.r, player.y);
    ctx.lineTo(player.x-player.r, player.y-player.r/2);
    ctx.lineTo(player.x-player.r, player.y+player.r/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // obstacles – rotating squares with hue colors
    obstacles.forEach(o=>{
      ctx.save();
      ctx.translate(o.x + o.w/2, o.y + o.h/2);
      o.angle += o.rotSpeed;
      ctx.rotate(o.angle);
      ctx.fillStyle = `hsl(${o.hue},80%,60%)`;
      ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
      ctx.restore();
    });
    // powerups – pulsing circles
    powerups.forEach(p=>{
      ctx.save();
      const pulse = Math.sin(performance.now()/200) * 0.2 + 1;
      ctx.globalAlpha = 0.8;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#44ff44';
      ctx.fillStyle = '#44ff44';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulse, 0, 2*Math.PI);
      ctx.fill();
      ctx.restore();
    });
    // timer display
    ctx.fillStyle='#fff';
    ctx.font='20px sans-serif';
    ctx.fillText('Time: '+Math.max(0,time).toFixed(1),10,30);
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff';
      ctx.font='40px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }

  function loop(timestamp){
    const dt = timestamp - last; last=timestamp;
    update(dt);
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
