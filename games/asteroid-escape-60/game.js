// Minimal Asteroid Escape game targeting canvas#game
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx=canvas.getContext('2d');
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;

  const ship={x:canvas.width/2,y:canvas.height/2,angle:0,vx:0,vy:0,fuel:100};
  const keys={ArrowLeft:false,ArrowRight:false,ArrowUp:false};
  const asteroids=[];
  const fuels=[];
  let gameOver=false;

  // Input handling
  window.addEventListener('keydown',e=>{if(e.key in keys) keys[e.key]=true;});
  window.addEventListener('keyup',e=>{if(e.key in keys) keys[e.key]=false;});

  function spawnAsteroid(){
    const side=Math.floor(Math.random()*4);
    const pos={x:0,y:0};
    const vel={x:0,y:0};
    const speed=1+Math.random()*1.5;
    const radius=20+Math.random()*30;
    switch(side){
      case 0: pos.x=0; pos.y=Math.random()*canvas.height; vel.x=speed; vel.y=(Math.random()-0.5)*speed; break;
      case 1: pos.x=canvas.width; pos.y=Math.random()*canvas.height; vel.x=-speed; vel.y=(Math.random()-0.5)*speed; break;
      case 2: pos.x=Math.random()*canvas.width; pos.y=0; vel.x=(Math.random()-0.5)*speed; vel.y=speed; break;
      case 3: pos.x=Math.random()*canvas.width; pos.y=canvas.height; vel.x=(Math.random()-0.5)*speed; vel.y=-speed; break;
    }
    asteroids.push({x:pos.x,y:pos.y,vx:vel.x,vy:vel.y,r:radius});
  }

  function spawnFuel(){
    const x=Math.random()*canvas.width;
    const y=Math.random()*canvas.height;
    fuels.push({x,y, r:8});
  }

  // Collision helpers
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}

  // Sound utilities
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let thrustNode = null;
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}
function playThrust(){
  if(thrustNode) return; // already playing
  thrustNode = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  thrustNode.type = 'square';
  thrustNode.frequency.value = 200;
  thrustNode.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  thrustNode.start();
  // stop after short burst when key released
  setTimeout(()=>{thrustNode.stop(); thrustNode=null;}, 150);
}
function playExplosion(){ playTone(80, 0.3); }
function playFuel(){ playTone(600, 0.1); }

function update(){
    if(gameOver) return;
    // Ship controls
    if(keys.ArrowLeft) ship.angle-=0.05;
    if(keys.ArrowRight) ship.angle+=0.05;
    if(keys.ArrowUp){
      const thrust=0.1;
      ship.vx+=Math.cos(ship.angle)*thrust;
      ship.vy+=Math.sin(ship.angle)*thrust;
      ship.fuel=Math.max(0,ship.fuel-0.1);
      playThrust();
    }
    // Move ship
    ship.x+=ship.vx; ship.y+=ship.vy;
    // Wrap around edges
    if(ship.x<0) ship.x+=canvas.width; if(ship.x>canvas.width) ship.x-=canvas.width;
    if(ship.y<0) ship.y+=canvas.height; if(ship.y>canvas.height) ship.y-=canvas.height;
    // Update asteroids
    for(let a of asteroids){a.x+=a.vx;a.y+=a.vy; if(a.x<0) a.x+=canvas.width; if(a.x>canvas.width) a.x-=canvas.width; if(a.y<0) a.y+=canvas.height; if(a.y>canvas.height) a.y-=canvas.height;}
    // Collision detection
    for(let i=asteroids.length-1;i>=0;i--){if(dist(ship,asteroids[i])<asteroids[i].r+10){gameOver=true; playExplosion(); break;}}
    for(let i=fuels.length-1;i>=0;i--){if(dist(ship,fuels[i])<fuels[i].r+10){ship.fuel+=30; fuels.splice(i,1); playFuel();}}
    // Lose condition
    if(ship.fuel<=0) { gameOver=true; playExplosion(); }
  }

  // Draw function with enhanced graphics
function draw(){
    // Background: starfield
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars (simple static for performance)
    if (!window._stars) {
        window._stars = Array.from({length: 200}, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.5
        }));
    }
    ctx.fillStyle = 'white';
    for (let s of window._stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
        ctx.fill();
    }
    // Ship with outline and thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-8, -8);
    ctx.closePath();
    ctx.fillStyle = '#00ffcc';
    ctx.strokeStyle = '#007777';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    // Thrust flame when accelerating
    if (keys.ArrowUp && ship.fuel > 0) {
        ctx.beginPath();
        ctx.moveTo(-8, 4);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-8, -4);
        ctx.closePath();
        const grad = ctx.createRadialGradient(-12, 0, 2, -12, 0, 8);
        grad.addColorStop(0, 'orange');
        grad.addColorStop(1, 'red');
        ctx.fillStyle = grad;
        ctx.fill();
    }
    ctx.restore();
    // Asteroids with gradient shading
    for (let a of asteroids) {
        const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
        grad.addColorStop(0, '#777');
        grad.addColorStop(1, '#333');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI);
        ctx.fill();
    }
    // Fuel cells with pulsating glow
    const time = Date.now() * 0.005;
    for (let f of fuels) {
        const glow = Math.abs(Math.sin(time + f.x + f.y)) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,215,0,${glow})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 2 * Math.PI);
        ctx.fill();
    }
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 20);
    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '48px sans-serif';
        ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
}

  function loop(){update();draw(); if(!gameOver) requestAnimationFrame(loop);}
  // Initial spawns
  setInterval(spawnAsteroid,2000);
  setInterval(spawnFuel,5000);
  spawnAsteroid(); spawnFuel();
  loop();
})();
