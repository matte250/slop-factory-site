// Simple Color Swarm game
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){return;}
  const ctx=canvas.getContext('2d');

  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure audio context runs after user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});

  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  function playCollect() { playBeep(600, 0.1); }
  function playMismatch() { playBeep(200, 0.15); }
  function playHazard() { playBeep(100, 0.3); }
  function playGameOver() { playBeep(50, 0.5); }

  const WIDTH=canvas.width=800;
  const HEIGHT=canvas.height=600;
  const COLORS=['red','green','blue','yellow'];
  let score=0;
  let timer=60; // seconds
  const PLAYER_RADIUS=10;
  const ORB_RADIUS=8;
  const PLAYER_SPEED=3;
  const ORB_SPEED=0.5; // drift
  const COLOR_CHANGE_INTERVAL=3000; // ms
  const SPAWN_INTERVAL=800; // ms

  const player={x:WIDTH/2,y:HEIGHT/2,color:COLORS[0]};
  const keys={};
  const orbs=[];

  // Input handling
  window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
  window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

  function spawnOrb(){
    const color=COLORS[Math.floor(Math.random()*COLORS.length)];
    const isHazard=Math.random()<0.1; // 10% hazard (black)
    const orb={
      x:Math.random()*WIDTH,
      y:Math.random()*HEIGHT,
      vx:(Math.random()-0.5)*ORB_SPEED,
      vy:(Math.random()-0.5)*ORB_SPEED,
      color:isHazard?'black':color,
      hazard:isHazard
    };
    orbs.push(orb);
  }

  function updatePlayer(){
    if(keys['arrowup']||keys['w']) player.y-=PLAYER_SPEED;
    if(keys['arrowdown']||keys['s']) player.y+=PLAYER_SPEED;
    if(keys['arrowleft']||keys['a']) player.x-=PLAYER_SPEED;
    if(keys['arrowright']||keys['d']) player.x+=PLAYER_SPEED;
    // keep inside bounds
    player.x=Math.max(0,Math.min(WIDTH,player.x));
    player.y=Math.max(0,Math.min(HEIGHT,player.y));
  }

  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}

  let gameOver = false;
  function checkCollisions(){
    for(let i=orbs.length-1;i>=0;i--){
      const o=orbs[i];
      if(distance(player,o)<PLAYER_RADIUS+ORB_RADIUS){
        if(o.hazard){
          timer=0; // end game
          playHazard();
        }else if(o.color===player.color){
          score++;
          // change player color on collect
          player.color=COLORS[Math.floor(Math.random()*COLORS.length)];
          playCollect();
        }else{
          score=Math.max(0,score-1);
          playMismatch();
        }
        orbs.splice(i,1);
      }
    }
  }

  function updateOrbs(){
    for(const o of orbs){
      o.x+=o.vx; o.y+=o.vy;
      if(o.x<0||o.x>WIDTH) o.vx*=-1;
      if(o.y<0||o.y>HEIGHT) o.vy*=-1;
    }
  }

  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // player with glow
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // orbs with radial gradient
    for (const o of orbs) {
      const grad = ctx.createRadialGradient(
        o.x,
        o.y,
        ORB_RADIUS * 0.2,
        o.x,
        o.y,
        ORB_RADIUS
      );
      grad.addColorStop(0, 'white');
      grad.addColorStop(1, o.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, ORB_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD with shadow
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 24);
    ctx.fillText('Time: ' + Math.ceil(timer), 10, 48);
    ctx.shadowBlur = 0;
  }

  // timers
  setInterval(()=>{player.color=COLORS[Math.floor(Math.random()*COLORS.length)];},COLOR_CHANGE_INTERVAL);
  setInterval(spawnOrb,SPAWN_INTERVAL);

  function loop(dt){
    if(timer<=0){
      if(!gameOver){
        playGameOver();
        gameOver = true;
      }
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle='white';
      ctx.font='48px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over',WIDTH/2,HEIGHT/2-20);
      ctx.font='24px sans-serif';
      ctx.fillText('Score: '+score,WIDTH/2,HEIGHT/2+20);
      return;
    }
    timer-=dt/1000;
    updatePlayer();
    updateOrbs();
    checkCollisions();
    draw();
    requestAnimationFrame(t=>loop(t-last));
  }
  let last=performance.now();
  requestAnimationFrame(t=>{last=t; loop(t);});
})();
