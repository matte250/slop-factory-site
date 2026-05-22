// Asteroid Dodger game 
// Canvas with id="game" must exist in the HTML.
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // no canvas
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioUnlocked = false;
  function unlockAudio(){
    if(audioUnlocked) return;
    const buffer = audioCtx.createBuffer(1,1,22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    audioUnlocked = true;
  }
  window.addEventListener('keydown', unlockAudio, {once:true});

  function beep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration/1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  }

  if(!canvas) return; // no canvas
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Starfield background
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({x: Math.random()*width, y: Math.random()*height, r: Math.random()*2+1});
  }

  // Ship
  const ship = {w:30, h:15, x: width/2, y: height-20, speed:5};
  let shield = 3;
  let score = 0;

  // Asteroids
  const asteroids = [];
  const asteroidSize = 20;
  const spawnRate = 1000; // ms
  let lastSpawn = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e=>{keys[e.key]=true});
  window.addEventListener('keyup', e=>{keys[e.key]=false});

  function update(dt){
    // Move ship
    if(keys['ArrowLeft']) ship.x -= ship.speed;
    if(keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width-ship.w, ship.x));

    // Spawn asteroids
    lastSpawn += dt;
    if(lastSpawn > spawnRate){
      lastSpawn = 0;
      const x = Math.random()*(width-asteroidSize);
      asteroids.push({x, y:-asteroidSize, speed:2+Math.random()*3});
    }

    // Update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.y += a.speed;
      // collision
      if(a.y + asteroidSize > ship.y && a.y < ship.y + ship.h &&
         a.x + asteroidSize > ship.x && a.x < ship.x + ship.w){
        shield--;
        asteroids.splice(i,1);
        if(shield<=0){
          // Game over
          alert('Game Over! Score: '+score);
          document.location.reload();
          return;
        }
        continue;
      }
      // out of screen
      if(a.y > height){
        score++;
        asteroids.splice(i,1);
      }
    }
  }

  function draw(){
    // Background
    ctx.fillStyle='black';
    ctx.fillRect(0,0,width,height);
    // Stars
    ctx.fillStyle='white';
    for(let i=0;i<stars.length;i++){
      const s=stars[i];
      ctx.fillRect(s.x,s.y,s.r,s.r);
    }
    // Ship (triangle)
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x+ship.w/2, ship.y-ship.h);
    ctx.lineTo(ship.x+ship.w, ship.y);
    ctx.closePath();
    ctx.fill();
    // Asteroids with gradient
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(
        a.x+asteroidSize/2, a.y+asteroidSize/2, asteroidSize/4,
        a.x+asteroidSize/2, a.y+asteroidSize/2, asteroidSize/2);
      grad.addColorStop(0,'lightgray');
      grad.addColorStop(1,'darkgray');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(a.x+asteroidSize/2, a.y+asteroidSize/2, asteroidSize/2,0,Math.PI*2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle='lime';
    ctx.font='14px monospace';
    ctx.fillText('Shield: '+shield,10,20);
    ctx.fillText('Score: '+score,10,40);
  }

  let lastTime=0;
  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
