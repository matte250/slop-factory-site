// Simple endless side‑scroll game for canvas with id "game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 800;
  const h = canvas.height = canvas.offsetHeight || 400;
  // pre‑generated star field
  const stars = Array.from({length:100},()=>({
    x: Math.random()*w,
    y: Math.random()*h,
    radius: Math.random()*1.5+0.5
  })));
  // player ship (triangle)
  const ship = {x:50, y:h/2-15, w:30, h:30, speed:3};
  // asteroid pool (circular)
  const asteroids=[];
  let frame=0, score=0, gameOver=false;
  // audio assets
  const bgMusic = new Audio('bg.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.4;
  const thrustSound = new Audio('thrust.wav');
  thrustSound.volume = 0.3;
  const explodeSound = new Audio('explosion.wav');
  explodeSound.volume = 0.5;
  let audioStarted = false;
  // keyboard handling
  const keys={};
  window.addEventListener('keydown',e=>{
    keys[e.key]=true;
    if(!audioStarted){
      bgMusic.play().catch(()=>{});
      audioStarted = true;
    }
    // play thrust on any movement key press
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      thrustSound.currentTime = 0;
      thrustSound.play().catch(()=>{});
    }
  });
  window.addEventListener('keyup',e=>keys[e.key]=false);
  function spawn(){
    const r = 15+Math.random()*15; // radius
    asteroids.push({x:w+r, y:Math.random()*(h-2*r), r, speed:2+Math.random()*3});
  }
  function update(){
    if(gameOver) return;
    // move ship
    if(keys['ArrowUp']) ship.y-=ship.speed;
    if(keys['ArrowDown']) ship.y+=ship.speed;
    if(keys['ArrowLeft']) ship.x-=ship.speed;
    if(keys['ArrowRight']) ship.x+=ship.speed;
    ship.y = Math.max(0, Math.min(h-ship.h, ship.y));
    ship.x = Math.max(0, Math.min(w-ship.w, ship.x));
    // spawn asteroids
    if(frame%60===0) spawn();
    // move asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.x-=a.speed;
      // remove off‑screen
      if(a.x+a.r<0){asteroids.splice(i,1); score++;}
      // collision check (circle‑rect)
      const cx=Math.max(a.x, Math.min(a.x+a.r, ship.x+ship.w/2));
      const cy=Math.max(a.y, Math.min(a.y+a.r, ship.y+ship.h/2));
      const distX=a.x+a.r-cx; const distY=a.y+a.r-cy;
      if(distX*distX+distY*distY < a.r*a.r){
        gameOver=true;
        explodeSound.play().catch(()=>{});
        bgMusic.pause();
      }
    }
    frame++;
  }
  function drawBackground(){
    // dark space gradient
    const grad = ctx.createLinearGradient(0,0,w,0);
    grad.addColorStop(0,'#001');
    grad.addColorStop(1,'#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);
    // stars
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.radius,0,Math.PI*2);ctx.fill();});
  }
  function draw(){
    drawBackground();
    // draw ship as triangle
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y+ship.h/2);
    ctx.lineTo(ship.x+ship.w, ship.y);
    ctx.lineTo(ship.x+ship.w, ship.y+ship.h);
    ctx.closePath();
    ctx.fill();
    // draw asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x+a.r/2, a.y+a.r/2, a.r*0.2, a.x+a.r/2, a.y+a.r/2, a.r);
      grad.addColorStop(0,'#aaa');
      grad.addColorStop(1,'#555');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r,0,Math.PI*2);
      ctx.fill();
    });
    // draw score
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='30px sans-serif';
      ctx.fillText('Game Over', w/2-80, h/2);
    }
  }
  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
