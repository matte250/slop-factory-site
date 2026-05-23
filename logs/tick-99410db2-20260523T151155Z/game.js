// Simple Asteroid Escape game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  let bgOsc = null;
  function startBackground(){
    if (bgOsc) return;
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 30;
    bgOsc.type = 'sine';
    bgOsc.connect(gain);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.connect(audioCtx.destination);
    bgOsc.start();
  }
  function playBeep(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Ship
  const ship = {w:40, h:20, x:W/2, y:H-30, speed:6};
  const keys = {left:false, right:false};

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames
  const stars = [];
  const STAR_COUNT = 80;
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.5});
  }
  let level = 0;
  let score = 0;
  let startTime = null;
  let gameOver = false;

  function spawnAsteroid(){
    const size = 20 + Math.random()*30;
    const angle = Math.random()*Math.PI*2;
    const rotSpeed = (Math.random()-0.5)*0.04; // radians per frame
    asteroids.push({x:Math.random()*(W-size), y:-size, w:size, h:size, speed:2+level*0.3, angle, rotSpeed});
    // sound for new asteroid
    playBeep(200, 0.05);
  }

  function update(){
    if (gameOver) return;
    // ship movement
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W-ship.w, ship.x));

    // asteroids
    asteroidTimer++;
    if (asteroidTimer >= asteroidInterval){
      asteroidTimer = 0;
      spawnAsteroid();
    }
    asteroids.forEach(a=>a.y+=a.speed);
    // remove off‑screen
    for(let i=asteroids.length-1;i>=0;i--){
      if (asteroids[i].y>H) asteroids.splice(i,1);
    }
    // collision
    for(const a of asteroids){
      if (a.x < ship.x+ship.w && a.x+a.w > ship.x && a.y < ship.y+ship.h && a.y+a.h > ship.y){
        gameOver = true;
        // collision sound
        playBeep(100, 0.4);
        break;
      }
    }
    // score & difficulty
    const elapsed = (Date.now()-startTime)/1000;
    score = Math.floor(elapsed);
    level = Math.floor(elapsed/10);
  }

function draw(){
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s=>{
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // ship
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (rotating polygons)
    ctx.fillStyle = '#a44';
    asteroids.forEach(a=>{
      ctx.save();
      ctx.translate(a.x + a.w/2, a.y + a.h/2);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.moveTo(-a.w/2, -a.h/2);
      ctx.lineTo(a.w/2, -a.h/2);
      ctx.lineTo(a.w/2, a.h/2);
      ctx.lineTo(-a.w/2, a.h/2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // update rotation for next frame
      a.angle += a.rotSpeed;
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    if (gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
      ctx.textAlign = 'start';
    }
  }
  }

  function loop(){
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input
  document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')keys.left=true; if(e.key==='ArrowRight')keys.right=true; startBackground();});
  document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft')keys.left=false; if(e.key==='ArrowRight')keys.right=false;});
  canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect(); ship.x = e.clientX - rect.left - ship.w/2;});

  // start
  startTime = Date.now();
  requestAnimationFrame(loop);
})();
