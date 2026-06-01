// Pixel Dodger – enhanced graphics
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  // Support high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = canvas.width / dpr, H = canvas.height / dpr;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player
  const player = {w:20, h:20, x:W/2-10, y:H-30, speed:4};
  const keys = {};
  document.addEventListener('keydown',e=>{keys[e.key]=true; if(audioCtx.state==='suspended'){audioCtx.resume();}});
  document.addEventListener('keyup',e=>keys[e.key]=false);

  // Game objects
let circles = [];
let powerUps = [];
let particles = [];
// create small particles for explosions
function createParticles(x,y,color){
  const count = 12;
  for(let i=0;i<count;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = Math.random()*2+1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      life: 30,
      maxLife:30,
      color,
    });
  }
}
let health = 3;
let frame = 0;
  const spawnCircle =()=>{
    const radius = 10+Math.random()*10;
    circles.push({x:Math.random()* (W-2*radius), y:-radius, r:radius, speed:1+frame*0.001});
  };
  const spawnPower =()=>{
    const r=8; powerUps.push({x:Math.random()*(W-2*r), y:-r, r, speed:1.5});
  };

  function update(){
    // Move player
    if(keys.ArrowLeft) player.x -= player.speed;
    if(keys.ArrowRight) player.x += player.speed;
    if(keys.ArrowUp) player.y -= player.speed;
    if(keys.ArrowDown) player.y += player.speed;
    // keep inside
    player.x = Math.max(0, Math.min(W-player.w, player.x));
    player.y = Math.max(0, Math.min(H-player.h, player.y));

    // spawn circles and power‑ups
    if(frame%60===0) spawnCircle(); // ~1 per second
    if(frame%600===0) spawnPower(); // occasional power‑up

    // move circles & power‑ups
    circles.forEach(c=>c.y+=c.speed);
    powerUps.forEach(p=>p.y+=p.speed);

    // collision detection – circles
    circles = circles.filter(c=>{
      const hit = !(player.x+player.w < c.x-c.r || player.x > c.x+c.r || player.y+player.h < c.y-c.r || player.y > c.y+c.r);
      if(hit){
        health--;
        // sound for hit
        playBeep(200, 'sawtooth', 0.15);
        // create explosion particles
        createParticles(c.x, c.y, 'rgba(255,80,80,0.9)');
        return false;
      }
      return c.y - c.r < H; // keep if onscreen
    });
    // collision detection – power‑ups
    powerUps = powerUps.filter(p=>{
      const hit = !(player.x+player.w < p.x-p.r || player.x > p.x+p.r || player.y+player.h < p.y-p.r || player.y > p.y+p.r);
      if(hit){
        health = Math.min(3, health+1);
        createParticles(p.x, p.y, 'rgba(0,200,0,0.8)');
        return false;
      }
      return p.y - p.r < H;
    });

    // update particles
    particles = particles.filter(part=>{
      part.x += part.vx;
      part.y += part.vy;
      part.life--;
      part.alpha = part.life/part.maxLife;
      return part.life>0;
    });

    frame++;
  }

  function draw(){
    // semi‑transparent fade for motion blur effect
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillRect(0,0,W,H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,W,H);
    bgGrad.addColorStop(0,'#e0f7ff');
    bgGrad.addColorStop(1,'#a0c4ff');
    ctx.fillStyle=bgGrad;
    ctx.fillRect(0,0,W,H);

    // player – rounded square with stroke
    ctx.fillStyle='black';
    ctx.strokeStyle='white';
    ctx.lineWidth=2;
    const rad=4;
    ctx.beginPath();
    ctx.moveTo(player.x+rad, player.y);
    ctx.lineTo(player.x+player.w-rad, player.y);
    ctx.quadraticCurveTo(player.x+player.w, player.y, player.x+player.w, player.y+rad);
    ctx.lineTo(player.x+player.w, player.y+player.h-rad);
    ctx.quadraticCurveTo(player.x+player.w, player.y+player.h, player.x+player.w-rad, player.y+player.h);
    ctx.lineTo(player.x+rad, player.y+player.h);
    ctx.quadraticCurveTo(player.x, player.y+player.h, player.x, player.y+player.h-rad);
    ctx.lineTo(player.x, player.y+rad);
    ctx.quadraticCurveTo(player.x, player.y, player.x+rad, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // circles – radial gradient for depth
    circles.forEach(c=>{
      const grad = ctx.createRadialGradient(c.x, c.y, c.r*0.2, c.x, c.y, c.r);
      grad.addColorStop(0,'rgba(255,80,80,0.9)');
      grad.addColorStop(1,'rgba(180,0,0,0.4)');
      ctx.fillStyle=grad;
      ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill();
    });
    // power‑ups – pulsating effect based on frame count
    powerUps.forEach(p=>{
      const pulse = 0.5+0.5*Math.abs(Math.sin(frame*0.05));
      ctx.fillStyle=`rgba(0,200,0,${pulse})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    // particles – draw fading circles
    particles.forEach(part=>{
      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, 2, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1; // reset alpha
    // health display
    ctx.fillStyle='black'; ctx.font='16px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText('Health: '+health,10,10);
    if(health<=0){
      ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='white'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='24px sans-serif';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }

  function loop(){
    if(health>0){ update(); }
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
