// Simple Space Junk Dodge game
// Assumes a <canvas id="game"></canvas> in the page
(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const width=canvas.width=canvas.clientWidth||800;
  const height=canvas.height=canvas.clientHeight||600;
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  function beep(freq, ms){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type='sine';
    osc.frequency.value=freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + ms/1000);
    osc.start(now);
    osc.stop(now + ms/1000);
  }

  function playThrust(){ beep(300, 80); }
  function playCrash(){ beep(100, 400); }
  let lastThrustTime = 0;

  // player ship
  const ship={x:80,y:height/2,w:30,h:20,dx:0,dy:0,angle:0,moving:false};
  const shipSpeed=4;

  // obstacles
  const junk=[];
  const junkSpawnRate=0.02; // chance per frame
  const junkSpeed=3;

  // score
  let score=0;
  let gameOver=false;

  // input handling
  const keys={};
  window.addEventListener('keydown',e=>{
    // resume audio on first interaction
    if(audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key]=true;
  });
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function update(){
    if(gameOver) return;
    // move ship
    ship.dx=0; ship.dy=0;
    if(keys.ArrowUp||keys.w) ship.dy=-shipSpeed;
    if(keys.ArrowDown||keys.s) ship.dy=shipSpeed;
    if(keys.ArrowLeft||keys.a) ship.dx=-shipSpeed;
    if(keys.ArrowRight||keys.d) ship.dx=shipSpeed;
    ship.x=Math.max(0,Math.min(width-ship.w, ship.x+ship.dx));
    ship.y=Math.max(0,Math.min(height-ship.h, ship.y+ship.dy));
    ship.moving = ship.dx!==0 || ship.dy!==0;
    // play thrust sound periodically when moving
    if(ship.moving && performance.now() - lastThrustTime > 100){
      playThrust();
      lastThrustTime = performance.now();
    }
    // update ship orientation when moving
    if(ship.moving){
      ship.angle = Math.atan2(ship.dy, ship.dx);
    }

    // spawn junk
    if(Math.random()<junkSpawnRate){
      const size=Math.random()*20+10;
      junk.push({
        x:width,
        y:Math.random()*(height-size),
        w:size,
        h:size,
        angle:0,
        rotSpeed:(Math.random()-0.5)*0.04
      });
    }

    // move junk
    for(let i=junk.length-1;i>=0;i--){
      const obj=junk[i];
      obj.x-=junkSpeed;
      if(obj.x+obj.w<0) junk.splice(i,1);
      // collision
    if(!gameOver && rectIntersect(ship,obj)){
      playCrash();
      gameOver=true;
    }
    }
    score++;
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
    // background gradient space
    const bgGrad = ctx.createLinearGradient(0,0,0,height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // background stars (moving particles)
    // initialize star field if not already
    if(!window._stars){
      window._stars = [];
      for(let i=0;i<80;i++){
        window._stars.push({x:Math.random()*width, y:Math.random()*height, speed:0.5+Math.random()*1.5, radius: Math.random()*1.5+0.5});
      }
    }
    // update and draw stars
    ctx.fillStyle='white';
    window._stars.forEach(s=>{
      s.x -= s.speed;
      if(s.x<0) { s.x=width; s.y=Math.random()*height; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    });
    // ship (with simple thruster when moving)
    ctx.save();
    ctx.translate(ship.x+ship.w/2, ship.y+ship.h/2);
    // rotate based on movement direction
    ctx.rotate(ship.angle || 0);
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(-ship.w/2, ship.h/2);
    ctx.lineTo(ship.w/2, -ship.h/2);
    ctx.lineTo(ship.w/2, ship.h/2);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if(ship.moving){
      ctx.fillStyle='orange';
      ctx.beginPath();
      ctx.moveTo(-ship.w/2, ship.h/2);
      ctx.lineTo(-ship.w/2-12, 0);
      ctx.lineTo(-ship.w/2, -ship.h/2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // junk (rotating polygons with gradient)
    junk.forEach(o=>{
      ctx.save();
      ctx.translate(o.x + o.w/2, o.y + o.h/2);
      o.angle += o.rotSpeed; // update rotation
      ctx.rotate(o.angle);
      // radial gradient for depth
      const grad = ctx.createRadialGradient(0, 0, o.w*0.2, 0, 0, Math.max(o.w, o.h)/2);
      grad.addColorStop(0, 'rgba(255,165,0,0.9)');
      grad.addColorStop(1, 'rgba(139,69,19,0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
      ctx.restore();
    });
    // score
    ctx.fillStyle='white';
    ctx.font='20px sans-serif';
    ctx.fillText('Score: '+score,10,30);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='40px sans-serif';
      ctx.fillText('Game Over', width/2-100, height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  function rectIntersect(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }
  // start
  requestAnimationFrame(loop);
})();
