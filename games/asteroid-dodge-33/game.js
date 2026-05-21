// Asteroid Dodge game – enhanced graphics
(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const width=canvas.width=canvas.clientWidth||800;
  const height=canvas.height=canvas.clientHeight||600;
  // starfield background
  const stars=[];
  for(let i=0;i<100;i++){
    stars.push({x:Math.random()*width, y:Math.random()*height, r:Math.random()*1.5+0.5});
  }
  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type='sine';
    osc.frequency.value=freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now+0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now+dur/1000);
    osc.start(now);
    osc.stop(now+dur/1000);
  }
  function playPoint(){ playTone(800,100); }
  function playCrash(){ playTone(150,300); }

  const ship={
    w:40, h:20,
    x:width/2-20, y:height-30,
    speed:5,
    draw(){
      ctx.fillStyle='white';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y+this.h);
      ctx.lineTo(this.x+this.w/2, this.y);
      ctx.lineTo(this.x+this.w, this.y+this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  const keys={};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  const asteroids=[];
  let frame=0, score=0, gameOver=false;

  function spawnAsteroid(){
    const size=Math.random()*30+20;
    asteroids.push({
      x:Math.random()*(width-size),
      y:-size,
      r:size/2,
      speed:2+frame/1000
    });
  }

  function update(){
    if(gameOver) return;
    // ship movement
    if(keys['ArrowLeft']) ship.x-=ship.speed;
    if(keys['ArrowRight']) ship.x+=ship.speed;
    ship.x=Math.max(0, Math.min(width-ship.w, ship.x));

    // move stars for parallax effect
    for(const s of stars){
      s.y+=0.5; // slow drift
      if(s.y>height){
        s.y=0;
        s.x=Math.random()*width;
      }
    }

    // spawn asteroids
    if(frame%60===0) spawnAsteroid();

    // update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.y+=a.speed;
      // remove off-screen bottom -> count score
      if(a.y-a.r>height){
        asteroids.splice(i,1);
        score++;
        playPoint();
      } else if(collides(a, ship)){
        gameOver=true;
        playCrash();
      }
    }
    frame++;
  }

  function collides(a, s){
    // simple bounding box check with ship triangle approximated as rectangle
    const shipRect={x:s.x, y:s.y, w:s.w, h:s.h};
    const distX=Math.abs(a.x + a.r - (shipRect.x + shipRect.w/2));
    const distY=Math.abs(a.y + a.r - (shipRect.y + shipRect.h/2));
    if(distX > (shipRect.w/2 + a.r)) return false;
    if(distY > (shipRect.h/2 + a.r)) return false;
    return true;
  }

  function draw(){
    // background gradient
    const bgGrad=ctx.createLinearGradient(0,0,0,height);
    bgGrad.addColorStop(0,'#000020');
    bgGrad.addColorStop(1,'#000000');
    ctx.fillStyle=bgGrad;
    ctx.fillRect(0,0,width,height);

    // draw stars
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});

    // draw ship with gradient outline
    ship.draw();
    ctx.strokeStyle='cyan';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y+ship.h);
    ctx.lineTo(ship.x+ship.w/2, ship.y);
    ctx.lineTo(ship.x+ship.w, ship.y+ship.h);
    ctx.closePath();
    ctx.stroke();

    // draw asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad=ctx.createRadialGradient(a.x+a.r, a.y+a.r, a.r*0.2, a.x+a.r, a.y+a.r, a.r);
      grad.addColorStop(0,'#bbbbbb');
      grad.addColorStop(1,'#555555');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(a.x+a.r, a.y+a.r, a.r,0,Math.PI*2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle='white';
    ctx.font='20px sans-serif';
    ctx.textAlign='left';
    ctx.fillText('Score: '+score,10,30);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.textAlign='center';
      ctx.font='30px sans-serif';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  // start
  ctx.font='20px sans-serif';
  loop();
})();
