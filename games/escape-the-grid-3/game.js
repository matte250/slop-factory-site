// Simple "Escape the Grid" game targeting <canvas id="game">
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // player
  const player = {size:20, x:width/2, y:height/2, speed:200}; // pixels per second
  const keys = {};

  // obstacles
  const obstacles = [];
  const spawnInterval = 2000; // ms
  let lastSpawn = 0;

  let startTime = performance.now();
  let gameOver = false;

  function spawn(){
    const radius = 10 + Math.random()*10;
    const x = Math.random()*width;
    const y = Math.random()*height;
    const angle = Math.random()*2*Math.PI;
    const speed = 30 + Math.random()*40;
    obstacles.push({x,y,radius,dx:Math.cos(angle)*speed,dy:Math.sin(angle)*speed,grow:10});
  }

  function update(dt){
    // player movement
    if(keys['ArrowLeft']||keys['a']) player.x -= player.speed*dt;
    if(keys['ArrowRight']||keys['d']) player.x += player.speed*dt;
    if(keys['ArrowUp']||keys['w']) player.y -= player.speed*dt;
    if(keys['ArrowDown']||keys['s']) player.y += player.speed*dt;
    // keep inside bounds
    player.x = Math.max(0, Math.min(width-player.size, player.x));
    player.y = Math.max(0, Math.min(height-player.size, player.y));

    // obstacles movement and growth
    obstacles.forEach(o=>{
      o.x += o.dx*dt;
      o.y += o.dy*dt;
      o.radius += o.grow*dt;
      // bounce off walls
      if(o.x<0||o.x>width) o.dx*=-1;
      if(o.y<0||o.y>height) o.dy*=-1;
    });
    // spawn new obstacles
    if(performance.now()-lastSpawn>spawnInterval){
      spawn();
      lastSpawn = performance.now();
    }
    // collision detection
    for(const o of obstacles){
      const cx = o.x, cy = o.y, r = o.radius;
      const px = player.x + player.size/2, py = player.y + player.size/2;
      const distSq = (cx-px)*(cx-px)+(cy-py)*(cy-py);
      if(distSq < (r+player.size/2)*(r+player.size/2)){
        gameOver = true; break;
      }
    }
  }

  function draw(){
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#000014');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Optional subtle star field
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for(let i=0;i<30;i++){
      const sx = Math.random()*width;
      const sy = Math.random()*height;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // player - a rounded square with shadow
    ctx.save();
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    const r = 4; // corner radius
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.size - r, player.y);
    ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + r);
    ctx.lineTo(player.x + player.size, player.y + player.size - r);
    ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - r, player.y + player.size);
    ctx.lineTo(player.x + r, player.y + player.size);
    ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // obstacles - radial gradient circles with slight blur
    obstacles.forEach(o=>{
      const radGrad = ctx.createRadialGradient(o.x, o.y, o.radius*0.3, o.x, o.y, o.radius);
      radGrad.addColorStop(0, 'rgba(255,80,80,0.9)');
      radGrad.addColorStop(1, 'rgba(150,0,0,0.3)');
      ctx.fillStyle = radGrad;
      ctx.shadowColor = 'rgba(255,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, 2*Math.PI);
      ctx.fill();
    });

    // score overlay
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    const seconds = Math.floor((performance.now()-startTime)/1000);
    ctx.fillText('Score: '+seconds, 10, 20);

    if(gameOver){
      // dark overlay
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over', width/2, height/2-20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: '+seconds, width/2, height/2+20);
    }
  }

  function loop(timestamp){
    if(gameOver){ draw(); return; }
    const dt = (timestamp - (lastTime||timestamp))/1000;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastTime;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // input listeners (resume audio on first interaction)
  window.addEventListener('keydown',e=>{
    if(audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key]=true;
  });
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // modify spawn to play sound
  const originalSpawn = spawn;
  spawn = function(){
    originalSpawn();
    playTone(200, 0.05);
  };

  // modify collision handling to play sound
  const originalUpdate = update;
  update = function(dt){
    originalUpdate(dt);
    if(gameOver){
      playTone(100, 0.3);
    }
  };

  requestAnimationFrame(loop);
})();
