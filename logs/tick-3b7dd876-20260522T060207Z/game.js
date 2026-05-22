// Nebula Escape – simple endless runner
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCrash(){playBeep(100,0.4);} // low thump
  function playFuel(){playBeep(800,0.1);} // short high beep
  const height = canvas.height = canvas.offsetHeight || 600;
  // Starfield background
  const stars = [];
  const starCount = 100;
  for(let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 + 1, s: 0.5 + Math.random() * 0.5 });
  }

  // Player ship
  const ship = {x:50, y:height/2, w:30, h:20, dy:0, fuel:100};
  const shipSpeed = 3;

  // Obstacles and pickups
  const asteroids = [];
  const fuels = [];
  const spawnAsteroid =()=>{
    const size = 20+Math.random()*30;
    asteroids.push({x:width, y:Math.random()*(height-size), w:size, h:size, speed:2+Math.random()*3});
  };
  const spawnFuel =()=>{
    const size = 15;
    fuels.push({x:width, y:Math.random()*(height-size), w:size, h:size, speed:2});
  };
  let asteroidTimer=0, fuelTimer=0;
  let gameOver=false;

  // Input handling
  const keys={};
  window.addEventListener('keydown',e=>{keys[e.key]=true;});
  window.addEventListener('keyup',e=>{keys[e.key]=false;});

  function update(){
    if(gameOver) return;
    // player movement
    if(keys['ArrowUp']) ship.dy = -shipSpeed;
    else if(keys['ArrowDown']) ship.dy = shipSpeed;
    else ship.dy = 0;
    ship.y += ship.dy;
    ship.y = Math.max(0, Math.min(height-ship.h, ship.y));

    // fuel consumption
    ship.fuel -= 0.05;
    if(ship.fuel<=0) endGame();

    // spawn obstacles / fuel
    asteroidTimer++; fuelTimer++;
    if(asteroidTimer>90) {spawnAsteroid(); asteroidTimer=0;}
    if(fuelTimer>300) {spawnFuel(); fuelTimer=0;}

    // move asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.x -= a.speed;
      if(a.x + a.w <0) asteroids.splice(i,1);
      else if(collide(ship,a)) {playCrash(); endGame();}
    }
    // move fuel cells
    for(let i=fuels.length-1;i>=0;i--){
      const f=fuels[i];
      f.x -= f.speed;
      if(f.x + f.w <0) fuels.splice(i,1);
      else if(collide(ship,f)) {playFuel(); ship.fuel = Math.min(100, ship.fuel+30); fuels.splice(i,1);}    }
    // move stars (parallax)
    for(let s of stars){
      s.x -= s.s;
      if(s.x < 0) {
        s.x = width;
        s.y = Math.random()*height;
      }
    }
  }

  function collide(r1,r2){
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function draw(){
    // gradient background
    const grad = ctx.createLinearGradient(0,0,width,height);
    grad.addColorStop(0,'#000020');
    grad.addColorStop(1,'#000040');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);
    // stars
    ctx.fillStyle='white';
    ctx.shadowBlur=2;
    ctx.shadowColor='white';
    for(let s of stars){
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,2*Math.PI);
      ctx.fill();
    }
    ctx.shadowBlur=0;
    // ship (triangle with stroke)
    ctx.fillStyle='cyan';
    ctx.strokeStyle='white';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // asteroids (circles)
    ctx.fillStyle='gray';
    asteroids.forEach(a=> {
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, Math.max(a.w,a.h)/2,0,2*Math.PI);
      ctx.fill();
    });
    // fuel cells (glowing yellow)
    ctx.fillStyle='yellow';
    ctx.shadowBlur=5;
    ctx.shadowColor='yellow';
    fuels.forEach(f=> {
      ctx.beginPath();
      ctx.arc(f.x + f.w/2, f.y + f.h/2, Math.max(f.w,f.h)/2,0,2*Math.PI);
      ctx.fill();
    });
    ctx.shadowBlur=0;
    // fuel gauge
    ctx.fillStyle='lime';
    ctx.fillRect(10,10, ship.fuel*2, 10);
    ctx.strokeStyle='black';
    ctx.strokeRect(10,10,200,10);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='48px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop(){
    if(!gameOver){
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function endGame(){gameOver=true;}

  loop();
})();
