// Simple Space Miner game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  // Load sounds
  const sounds = {
    drill: new Audio('https://www.soundjay.com/mechanical/sounds/drill-1.mp3'),
    hit: new Audio('https://www.soundjay.com/button/sounds/button-16.mp3'),
    gameOver: new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3')
  };
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = {x: W/2, y: H-80, w: 30, h: 30, speed: 3, fuel: 100, ore: 0, lives: 3};
  const asteroids = [];
  const debris = [];
  const stars = [];
  // initialise background stars
  for(let i=0;i<100;i++){
    stars.push({x: Math.random()*W, y: Math.random()*H, brightness: Math.random()});
  }
  let keys = {};
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function spawn(){
    // asteroid
    const a = {x: Math.random()* (W-40), y: -40, w: 40, h: 40, speed: 1+Math.random()*2};
    asteroids.push(a);
    // debris (danger)
if(Math.random()<0.4){
        const d = {x: Math.random()* (W-30), y: -30, w: 30, h: 30, speed: 2+Math.random()*2, angle: Math.random()*Math.PI*2};
        debris.push(d);
      }
  }

  function update(){
    if(gameOver) return;
    // ship movement
    if(keys.ArrowLeft && ship.x>0) ship.x -= ship.speed;
    if(keys.ArrowRight && ship.x+ship.w<W) ship.x += ship.speed;
    if(keys.ArrowUp && ship.y>0) ship.y -= ship.speed;
    if(keys.ArrowDown && ship.y+ship.h<H) ship.y += ship.speed;

    // fuel consumption
    ship.fuel = Math.max(0, ship.fuel - 0.02);
    if(ship.fuel===0){
      ship.lives = 0;
      if(!gameOver){
        gameOver = true;
        sounds.gameOver.play();
      }
    }

    // move asteroids & collect ore
    asteroids.forEach((a,i)=>{
      a.y += a.speed;
      if(a.y>H){ asteroids.splice(i,1); }
        // collision with ship -> collect ore
        if(a.x < ship.x+ship.w && a.x+a.w > ship.x && a.y < ship.y+ship.h && a.y+a.h > ship.y){
        ship.ore += 1;
        sounds.drill.play();
        asteroids.splice(i,1);
      }
    });

    // move debris & collisions
    debris.forEach((d,i)=>{
      d.y += d.speed;
      d.angle += 0.04; // rotate debris
      if(d.y>H){ debris.splice(i,1); }
      if(d.x < ship.x+ship.w && d.x+d.w > ship.x && d.y < ship.y+ship.h && d.y+d.h > ship.y){
        ship.lives -= 1;
        sounds.hit.play();
        debris.splice(i,1);
        if(ship.lives<=0){
          gameOver = true;
          sounds.gameOver.play();
        }
      }
    });

    // spawn new objects periodically
    if(Math.random()<0.02) spawn();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // background stars
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,W,H);
    stars.forEach(s=>{
      ctx.fillStyle = s.brightness > 0.8 ? '#fff' : '#bbb';
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (circles)
    ctx.fillStyle = '#888';
    asteroids.forEach(a=>{
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // debris (rotating squares)
    ctx.fillStyle = '#f00';
    debris.forEach(d=>{
      ctx.save();
      ctx.translate(d.x + d.w/2, d.y + d.h/2);
      ctx.rotate(d.angle || 0);
      ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);
      ctx.restore();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${ship.lives}  Fuel: ${ship.fuel.toFixed(0)}%  Ore: ${ship.ore}` ,10,20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  // start
  requestAnimationFrame(loop);
})();
