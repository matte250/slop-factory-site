// Simple Space Miner game with enhanced graphics
// Canvas with id "game"
(function(){
  const canvas = document.getElementById('game');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioInitialized = false;
  function initAudio(){
    if(audioInitialized) return;
    // resume audio context on user gesture
    if(audioCtx.state === 'suspended') audioCtx.resume();
    audioInitialized = true;
  }
  function playLaser(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 660; // laser pitch
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  function playExplosion(){
    const bufferSize = audioCtx.sampleRate * 0.3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.3);
  }
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const state = {
  particles:[], // explosion particles

    ship:{x:width/2,y:height/2,angle:0,rad:12},
    fuel:100,
    minerals:0,
    target:50,
    laser:{active:false, x:0,y:0,dx:0,dy:0, life:0},
    asteroids:[],
    keys:{ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,KeyW:false,KeyS:false,KeyA:false,KeyD:false,Space:false}
  };

  // Helper functions
  function rand(min,max){return Math.random()*(max-min)+min;}
  function spawnAsteroid(){
    const r = rand(10,25);
    const angle = rand(0,Math.PI*2);
    const speed = rand(0.5,1.5);
    const side = Math.floor(rand(0,4)); // 0 top,1 right,2 bottom,3 left
    let x,y,dx,dy;
    if(side===0){x=rand(0,width); y=-r;}
    else if(side===1){x=width+r; y=rand(0,height);} 
    else if(side===2){x=rand(0,width); y=height+r;}
    else {x=-r; y=rand(0,height);}    
    dx = Math.cos(angle)*speed;
    dy = Math.sin(angle)*speed;
    state.asteroids.push({x,y,dx,dy,r});
  }
  for(let i=0;i<8;i++) spawnAsteroid();

  // Input handling
  window.addEventListener('keydown',e=>{initAudio(); state.keys[e.code]=true;});
  window.addEventListener('keyup',e=>{state.keys[e.code]=false;});

  function update(dt){
    // Fuel drain
    state.fuel = Math.max(0, state.fuel - dt*0.02);
    // Ship control
    const turnSpeed = 0.004*dt;
    const thrust = 0.05*dt;
    if(state.keys.ArrowLeft||state.keys.KeyA) state.ship.angle -= turnSpeed;
    if(state.keys.ArrowRight||state.keys.KeyD) state.ship.angle += turnSpeed;
    if(state.keys.ArrowUp||state.keys.KeyW){
      state.ship.x += Math.cos(state.ship.angle)*thrust;
      state.ship.y += Math.sin(state.ship.angle)*thrust;
    }
    if(state.keys.ArrowDown||state.keys.KeyS){
      state.ship.x -= Math.cos(state.ship.angle)*thrust*0.5;
      state.ship.y -= Math.sin(state.ship.angle)*thrust*0.5;
    }
    // Keep ship within bounds (wrap)
    if(state.ship.x<0) state.ship.x+=width; if(state.ship.x>width) state.ship.x-=width;
    if(state.ship.y<0) state.ship.y+=height; if(state.ship.y>height) state.ship.y-=height;

    // Laser fire
    if(state.keys.Space && !state.laser.active){
      state.laser.active = true;
      state.laser.x = state.ship.x;
      state.laser.y = state.ship.y;
      const speed = 4;
      state.laser.dx = Math.cos(state.ship.angle)*speed;
      state.laser.dy = Math.sin(state.ship.angle)*speed;
      state.laser.life = 30; // frames
      playLaser();
    }
    // Laser update
    if(state.laser.active){
      state.laser.x += state.laser.dx;
      state.laser.y += state.laser.dy;
      state.laser.life--;
      if(state.laser.life<=0) state.laser.active = false;
    }

    // Asteroid movement
    state.asteroids.forEach(a=>{a.x+=a.dx; a.y+=a.dy;});
    // Remove off‑screen asteroids and respawn
    state.asteroids = state.asteroids.filter(a=>{
      const off = a.x<-a.r||a.x>width+a.r||a.y<-a.r||a.y>height+a.r;
      if(off) spawnAsteroid();
      return !off;
    });

    // Collision detection laser‑asteroid
    if(state.laser.active){
      for(let i=state.asteroids.length-1;i>=0;i--){
        const a=state.asteroids[i];
        const dx=state.laser.x-a.x, dy=state.laser.y-a.y;
        if(dx*dx+dy*dy < (a.r)*(a.r)){
          // hit
          state.asteroids.splice(i,1);
          spawnAsteroid();
          state.minerals++;
          state.fuel = Math.min(100, state.fuel+5); // small boost
            state.laser.active = false;
            // create explosion particles
            const count = 12;
            for(let i=0;i<count;i++){
              const angle = Math.random()*Math.PI*2;
              const speed = Math.random()*2+1;
              state.particles.push({
                x:a.x,
                y:a.y,
                vx:Math.cos(angle)*speed,
                vy:Math.sin(angle)*speed,
                life:30,
                size: Math.random()*2+1,
                color:'orange'
              });
            }
            break;
          }
        }
      }
    }
    // Ship‑asteroid collision
    for(const a of state.asteroids){
      const dx=state.ship.x-a.x, dy=state.ship.y-a.y;
      if(dx*dx+dy*dy < (a.r+state.ship.rad)*(a.r+state.ship.rad)){
        state.fuel = 0; // immediate lose
      }
    }
    // Update particles
    state.particles = state.particles.filter(p=>{
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
    for(const a of state.asteroids){
      const dx=state.ship.x-a.x, dy=state.ship.y-a.y;
      if(dx*dx+dy*dy < (a.r+state.ship.rad)*(a.r+state.ship.rad)){
        state.fuel = 0; // immediate lose
      }
    }
  }

  // Generate starfield once
const stars = [];
function initStars(count=200){
  for(let i=0;i<count;i++){
    stars.push({x:Math.random()*width, y:Math.random()*height, r:Math.random()*1.5+0.5});
  }
}
initStars();

function draw(){
    // background gradient
const bgGrad = ctx.createLinearGradient(0,0,width,height);
bgGrad.addColorStop(0,'#001020');
bgGrad.addColorStop(1,'#000');
ctx.fillStyle = bgGrad;
ctx.fillRect(0,0,width,height);
// draw stars with twinkle
stars.forEach(s=>{
  const twinkle = 0.5 + Math.random()*0.5; // 0.5-1.0
  ctx.globalAlpha = twinkle;
  ctx.beginPath();
  ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
  ctx.fill();
});
ctx.globalAlpha = 1; // reset
    // draw ship
    // draw ship with glow
    ctx.save();
    ctx.translate(state.ship.x, state.ship.y);
    ctx.rotate(state.ship.angle);
    // ship shape
    ctx.beginPath();
    ctx.moveTo(15,0);
    ctx.lineTo(-10,-10);
    ctx.lineTo(-10,10);
    ctx.closePath();
    // glow effect
    ctx.shadowColor='cyan';
    ctx.shadowBlur=10;
    ctx.fillStyle='cyan';
    ctx.fill();
    ctx.shadowBlur=0; // reset
    ctx.restore();
    // draw asteroids with gradient shading
    state.asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0,'#aaa');
      grad.addColorStop(1,'#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
      ctx.fill();
    });
    // draw laser
    if(state.laser.active){
      // laser glow
      ctx.save();
      ctx.shadowColor='red';
      ctx.shadowBlur=8;
      ctx.strokeStyle='red';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(state.laser.x,state.laser.y);
      ctx.lineTo(state.laser.x - state.laser.dx*2, state.laser.y - state.laser.dy*2);
      ctx.stroke();
      ctx.restore();
    }
    // draw explosion particles
    state.particles.forEach(p=>{
      ctx.globalAlpha = p.life/30;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1; // reset
    // UI
    ctx.fillStyle='lime';
    ctx.font='16px monospace';
    ctx.fillText('Fuel: '+Math.floor(state.fuel),10,20);
    ctx.fillText('Minerals: '+state.minerals+'/'+state.target,10,40);
    if(state.fuel<=0||state.minerals>=state.target){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle='white';
      ctx.textAlign='center';
      ctx.font='48px sans-serif';
      const msg = state.minerals>=state.target ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, width/2, height/2);
    }
  }

  let last=performance.now();
  function loop(){
    const now=performance.now();
    const dt=now-last;
    last=now;
    if(state.fuel>0 && state.minerals<state.target){
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
