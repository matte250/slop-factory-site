// Enhanced Circuit Escape game with improved graphics
document.addEventListener('DOMContentLoaded', () => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(frequency, duration=0.1, type='sine') {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playCollect() { playTone(800, 0.07, 'triangle'); }
  function playCollision() { playTone(150, 0.3, 'sawtooth'); }
  function playTimeUp() { playTone(300, 0.5, 'square'); }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player
  const player = {x: width/2, y: height/2, r: 5, speed: 3};
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Game objects
  const pulses = []; // moving obstacles
  const components = []; // static obstacles
  const nodes = []; // power nodes
  let timer = 30; // seconds

  // Helpers
  function randRange(min, max) { return Math.random() * (max - min) + min; }
  function spawnPulse() {
    const side = Math.floor(Math.random()*4);
    let x, y, vx, vy;
    const speed = 1.5 + Math.random()*1.5;
    if (side===0) {x=0; y=randRange(0,height); vx=speed; vy=randRange(-1,1);} // left
    else if (side===1) {x=width; y=randRange(0,height); vx=-speed; vy=randRange(-1,1);} // right
    else if (side===2) {x=randRange(0,width); y=0; vx=randRange(-1,1); vy=speed;} // top
    else {x=randRange(0,width); y=height; vx=randRange(-1,1); vy=-speed;}
    pulses.push({x,y,vx,vy,r:8});
  }
  function spawnComponent() {
    const w = 20, h = 20;
    const x = randRange(0,width-w);
    const y = randRange(0,height-h);
    components.push({x,y,w,h});
  }
  function spawnNode() {
    const x = randRange(20,width-20);
    const y = randRange(20,height-20);
    nodes.push({x,y,r:6});
  }

  // Initial spawns
  for(let i=0;i<5;i++) spawnComponent();
  setInterval(spawnPulse, 1500);
  setInterval(spawnNode, 5000);
  setInterval(()=>{ timer = Math.max(0, timer-1); },1000);

  function update() {
    // Move player
    if (keys['ArrowUp']||keys['w']) player.y -= player.speed;
    if (keys['ArrowDown']||keys['s']) player.y += player.speed;
    if (keys['ArrowLeft']||keys['a']) player.x -= player.speed;
    if (keys['ArrowRight']||keys['d']) player.x += player.speed;
    // Clamp
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));
    // Move pulses
    for(let p of pulses) { p.x += p.vx; p.y += p.vy; }
    // Remove off‑screen pulses
    for(let i=pulses.length-1;i>=0;i--){ const p=pulses[i]; if(p.x<0||p.x>width||p.y<0||p.y>height) pulses.splice(i,1); }
    // Check collisions
    for(let i=pulses.length-1;i>=0;i--) {
      const p=pulses[i];
      const dx=p.x-player.x, dy=p.y-player.y;
      if(Math.hypot(dx,dy)<p.r+player.r) { playCollision(); endGame(); return; }
    }
    for(const c of components) {
      if(player.x>c.x && player.x<c.x+c.w && player.y>c.y && player.y<c.y+c.h) { endGame(); return; }
    }
    // Power nodes
    for(let i=nodes.length-1;i>=0;i--) {
      const n=nodes[i];
      if(Math.hypot(n.x-player.x,n.y-player.y)<n.r+player.r) {
        timer += 5; // extend time
        nodes.splice(i,1);
        playCollect();
      }
    }
    if(timer<=0) { playTimeUp(); endGame(); return; }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,width,height);
    bgGrad.addColorStop(0,'#0d0d25');
    bgGrad.addColorStop(1,'#001133');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // player with glow
    ctx.shadowColor='lime';
    ctx.shadowBlur=10;
    const playerGrad = ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,player.r);
    playerGrad.addColorStop(0,'#aaffaa');
    playerGrad.addColorStop(1,'#00ff00');
    ctx.fillStyle=playerGrad;
    ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,2*Math.PI); ctx.fill();
    ctx.shadowBlur=0; // reset for other objects
    // pulses with red glow
    ctx.shadowColor='red';
    ctx.shadowBlur=8;
    for(const p of pulses){
      const pulseGrad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      pulseGrad.addColorStop(0,'#ff7777');
      pulseGrad.addColorStop(1,'#ff0000');
      ctx.fillStyle=pulseGrad;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,2*Math.PI); ctx.fill();
    }
    ctx.shadowBlur=0;
    // components (circuit board pieces)
    ctx.fillStyle='rgba(100,100,100,0.8)';
    ctx.strokeStyle='rgba(150,150,150,0.6)';
    ctx.lineWidth=1;
    for(const c of components){
      ctx.fillRect(c.x,c.y,c.w,c.h);
      ctx.strokeRect(c.x,c.y,c.w,c.h);
    }
    // nodes with golden glow
    ctx.shadowColor='gold';
    ctx.shadowBlur=12;
    for(const n of nodes){
      const nodeGrad = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
      nodeGrad.addColorStop(0,'#fff9c4');
      nodeGrad.addColorStop(1,'#ffb400');
      ctx.fillStyle=nodeGrad;
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,2*Math.PI); ctx.fill();
    }
    ctx.shadowBlur=0;
    // timer text with shadow
    ctx.fillStyle='white';
    ctx.font='20px sans-serif';
    ctx.shadowColor='black';
    ctx.shadowBlur=4;
    ctx.fillText('Time: '+Math.ceil(timer),10,30);
    ctx.shadowBlur=0;
  }

  let running = true;
  function endGame(){ running = false; ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,width,height); ctx.fillStyle='white'; ctx.font='30px sans-serif'; ctx.fillText('Game Over', width/2-80, height/2); }

  function loop(){ if(!running) return; update(); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
});
