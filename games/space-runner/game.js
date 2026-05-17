// Simple endless‑runner spaceship game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;

  // ---------- Game state ----------
  const player = {x:100, y:h/2, radius:15, speed:3, fuel:200, alive:true};
  const keys = {up:false, down:false, left:false, right:false};
  const asteroids = [];
  const fuels = [];
  let frame = 0;

  // ---------- Helpers ----------
  function rand(min,max){return Math.random()*(max-min)+min;}
  function rectCollide(ax,ay,aw,ah,bx,by,bw,bh){
    return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
  }
  function circleCollide(c1,c2){
    const dx=c1.x-c2.x, dy=c1.y-c2.y;
    return dx*dx+dy*dy < (c1.r+c2.r)*(c1.r+c2.r);
  }

  // ---------- Audio Setup ----------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
    osc.stop(audioCtx.currentTime+dur);
  }
  function playThrust(){ playTone(200, 0.1); }
  function playExplosion(){ playTone(100, 0.3); }
  function playPickup(){ playTone(400, 0.15); }
  let lastThrust = 0;

  // ---------- Input ----------
  window.addEventListener('keydown',e=>{
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if(e.key==='ArrowUp')keys.up=true;
    if(e.key==='ArrowDown')keys.down=true;
    if(e.key==='ArrowLeft')keys.left=true;
    if(e.key==='ArrowRight')keys.right=true;
  });
  window.addEventListener('keyup',e=>{if(e.key==='ArrowUp')keys.up=false; if(e.key==='ArrowDown')keys.down=false; if(e.key==='ArrowLeft')keys.left=false; if(e.key==='ArrowRight')keys.right=false;});

  // ---------- Main loop ----------
  function update(){
    if(!player.alive) return;
    // player movement
    if(keys.up) player.y-=player.speed;
    if(keys.down) player.y+=player.speed;
    if(keys.left) player.x-=player.speed;
    if(keys.right) player.x+=player.speed;
    // thrust sound (limit to every 100ms)
    if(keys.up){
      const now = performance.now();
      if(now - lastThrust > 100){
        playThrust();
        lastThrust = now;
      }
    }
    // keep inside bounds
    player.x = Math.max(0, Math.min(w, player.x));
    player.y = Math.max(0, Math.min(h, player.y));
    // fuel consumption
    player.fuel -= 0.05;
    if(player.fuel<=0){player.alive=false;}
    // spawn asteroids
    if(frame%60===0){ // approx 1 per second
      asteroids.push({x:w, y:rand(0,h), r:rand(10,30), speed:rand(2,5)});
    }
    // spawn fuel cells
    if(frame%300===0){
      fuels.push({x:w, y:rand(0,h), r:8, speed:3});
    }
    // update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.x -= a.speed;
      if(a.x+ a.r <0) asteroids.splice(i,1);
      // collision
      if(circleCollide({x:player.x, y:player.y, r:player.radius}, a)){
        playExplosion();
        player.alive=false; break;
      }
    }
    // update fuel cells
    for(let i=fuels.length-1;i>=0;i--){
      const f=fuels[i];
      f.x -= f.speed;
      if(f.x+ f.r <0) fuels.splice(i,1);
      if(circleCollide({x:player.x, y:player.y, r:player.radius}, f)){
        player.fuel = Math.min(200, player.fuel+50);
        playPickup();
        fuels.splice(i,1);
      }
    }
    frame++;
  }

  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,w, h);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);
    // starfield with varying size and opacity
    for(let i=0;i<80;i++){
      const starSize = rand(0.5,2);
      ctx.fillStyle = `rgba(255,255,255,${rand(0.3,0.9)})`;
      ctx.fillRect(rand(0,w), rand(0,h), starSize, starSize);
    }
    // player ship (white triangle) with simple thrust effect
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.radius);
    ctx.lineTo(player.x - player.radius, player.y + player.radius);
    ctx.lineTo(player.x + player.radius, player.y + player.radius);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving up
    if(keys.up){
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y + player.radius);
      ctx.lineTo(player.x - player.radius/2, player.y + player.radius + 10);
      ctx.lineTo(player.x + player.radius/2, player.y + player.radius + 10);
      ctx.closePath();
      ctx.fill();
    }
    // asteroids with radial gradient for depth
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
      ctx.fill();
    });
    // fuel cells (glow)
    fuels.forEach(f=>{
      const glow = ctx.createRadialGradient(f.x, f.y, f.r*0.5, f.x, f.y, f.r*2);
      glow.addColorStop(0, '#0f0');
      glow.addColorStop(1, '#030');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
      ctx.fill();
    });
    // HUD: fuel bar
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: '+Math.max(0,Math.floor(player.fuel)),10,20);
    const barWidth = 100;
    ctx.fillStyle = '#555';
    ctx.fillRect(10,30,barWidth,10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10,30, barWidth * (player.fuel/200),10);
    if(!player.alive){
      ctx.fillStyle = 'red';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over', w/2-100, h/2);
    }
  }

  function loop(){
    update();
    draw();
    if(player.alive) requestAnimationFrame(loop);
  }
  // start
  requestAnimationFrame(loop);
})();
