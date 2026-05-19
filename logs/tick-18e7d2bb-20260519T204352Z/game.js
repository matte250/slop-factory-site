// Minimal Endless Runner based on IDEA.md
// Canvas with id="game"
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // Starfield data
  const STAR_COUNT = 120;
  const stars = [];
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      z: Math.random() // depth factor 0..1
    });
  }

  function updateStars(dt){
    const speed = 0.03 * dt; // adjust for smoothness
    for(const s of stars){
      s.x -= speed * (1 + s.z*2);
      if(s.x < 0) s.x += W;
    }
  }

  function drawStars(){
    ctx.fillStyle = '#fff';
    for(const s of stars){
      const size = 1 + s.z*2;
      ctx.fillRect(s.x, s.y, size, size);
    }
  }

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust(){ beep(400, 0.08); }
  function playCollision(){ beep(150, 0.4); }
  // simple background hum loop
  function startBackground(){
    setInterval(()=>{ beep(200, 0.2); }, 3000);
  }
  startBackground();

  // Rocket
  const rocket = {x: W*0.2, y: H/2, w:20, h:30, vy:0};
  const GRAVITY = 0.4;
  const THRUST = -8;

  // Obstacles
  const obstacles = [];
  const OBSTACLE_W = 30;
  const OBSTACLE_GAP = 150;
  const SPAWN_INTERVAL = 1500; // ms
  let lastSpawn = 0;

  // Score
  let score = 0;
  let gameOver = false;

  function reset(){
    rocket.y = H/2; rocket.vy = 0; obstacles.length=0; score=0; lastSpawn=0; gameOver=false;
  }

  function spawn(){
    const gapY = Math.random() * (H - OBSTACLE_GAP - 40) + 20;
    obstacles.push({x:W, y:0, w:OBSTACLE_W, h:gapY}); // top
    obstacles.push({x:W, y:gapY+OBSTACLE_GAP, w:OBSTACLE_W, h:H-(gapY+OBSTACLE_GAP)}); // bottom
  }

  function update(dt){
    if(gameOver) return;
    // rocket physics
    rocket.vy += GRAVITY;
    rocket.y += rocket.vy;
    // boundaries
    if(rocket.y < 0 || rocket.y + rocket.h > H) gameOver = true;
    // obstacles move
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= dt * 0.2; // speed
      // collision
      if(o.x < rocket.x+rocket.w && o.x+o.w > rocket.x &&
         o.y < rocket.y+rocket.h && o.y+o.h > rocket.y){
        gameOver = true; break;
      }
      // remove off‑screen
      if(o.x + o.w < 0) obstacles.splice(i,1);
    }
    // spawn new obstacles
    if(Date.now() - lastSpawn > SPAWN_INTERVAL){
      spawn();
      lastSpawn = Date.now();
    }
    // score based on time
    score = Math.floor((Date.now()-startTime)/100);
  }

function draw(dt){
    ctx.clearRect(0,0,W,H);
    // background gradient
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, '#001a33');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);
    // starfield
    updateStars(dt);
    drawStars();
    // rocket with thrust flame
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(rocket.x, rocket.y);
    ctx.lineTo(rocket.x, rocket.y+rocket.h);
    ctx.lineTo(rocket.x+rocket.w, rocket.y+rocket.h/2);
    ctx.closePath();
    ctx.fill();
    // flame when thrusting
    if(rocket.vy < 0){
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y+rocket.h/2);
      ctx.lineTo(rocket.x-10, rocket.y+rocket.h/2+5);
      ctx.lineTo(rocket.x, rocket.y+rocket.h/2+10);
      ctx.closePath();
      ctx.fill();
    }
    // obstacles as dark rectangles with slight gradient
    obstacles.forEach(o=>{
      const obsGrad = ctx.createLinearGradient(o.x,0,o.x+o.w,0);
      obsGrad.addColorStop(0,'#333');
      obsGrad.addColorStop(1,'#111');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    if(gameOver){
      ctx.fillStyle = 'yellow';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W/2-60, H/2);
    }
  }
  }

  let startTime = Date.now();
  function loop(timestamp){
    const dt = timestamp - (prevTimestamp||timestamp);
    prevTimestamp = timestamp;
    update(dt);
    draw(dt);
    if(!gameOver) requestAnimationFrame(loop);
  }
  let prevTimestamp;
  // input
  function thrust(){
    if(gameOver){reset(); startTime=Date.now(); requestAnimationFrame(loop);}
    else rocket.vy = THRUST;
  }
  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('touchstart', e=>{e.preventDefault(); thrust();});
  // start
  requestAnimationFrame(loop);
})();
