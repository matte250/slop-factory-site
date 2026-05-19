// Simple Asteroid Escape game targeting <canvas id="game"></canvas>
(function(){
  const canvas=document.getElementById('game');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width=canvas.clientWidth||800;
  const H=canvas.height=canvas.clientHeight||600;
  // Load sounds
  const crashSound = new Audio('https://cdn.jsdelivr.net/gh/iamtheovll/misc-sounds/boom.mp3');
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/iamtheovll/misc-sounds/loop.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  // Start background music when ready
  bgMusic.play().catch(()=>{});

  const ship={w:40,h:20,x:W/2-20,y:H-30,dx:0,spd:5};
  const keys={};
  const asteroids=[];
  let lastSpawn=0, spawnInterval=1000, start=Date.now(), score=0, speedInc=0.001;

  // input
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function spawn(){
    const r=15+Math.random()*10;
    asteroids.push({x:Math.random()* (W-2*r)+r, y:-r, r, speed:2+Math.random()*2});
  }

  function update(dt){
    // ship movement
    ship.dx=0;
    if(keys['ArrowLeft']) ship.dx=-ship.spd;
    if(keys['ArrowRight']) ship.dx=ship.spd;
    ship.x=Math.max(0,Math.min(W-ship.w, ship.x+ship.dx));

    // spawn asteroids
    if(Date.now()-lastSpawn>spawnInterval){spawn();lastSpawn=Date.now();}
    // increase difficulty
    spawnInterval=Math.max(200, spawnInterval- dt*speedInc);

    // update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.y+=a.speed;
      // collision
      const cx=ship.x+ship.w/2, cy=ship.y+ship.h/2;
      const dist=Math.hypot(cx-a.x, cy-a.y);
      if(dist<a.r+Math.max(ship.w,ship.h)/2){
        // game over - play sound
        crashSound.currentTime = 0;
        crashSound.play().catch(()=>{});
        alert('Game Over! Score: '+Math.floor(score));
        document.location.reload();
        return;
      }
      if(a.y - a.r > H) asteroids.splice(i,1);
    }
    score=(Date.now()-start)/1000;
  }

function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#000022');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // ship (already drawn with gradient in its own block)
    // asteroids with radial gradient shading
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,2*Math.PI);
      ctx.fill();
    });
    // score
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score.toFixed(1),10,20);
  }

  let last=performance.now();
  function loop(ts){
    const dt=ts-last; last=ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
