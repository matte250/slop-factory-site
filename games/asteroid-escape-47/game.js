// Simple Asteroid Escape game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ----- audio -----
  const thrustAudio = new Audio('https://www.soundjay.com/mechanical/switch-1.mp3');
  const collisionAudio = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');
  thrustAudio.volume = 0.3;
  collisionAudio.volume = 0.5;

  // ----- ship -----
  const ship = {
    x: width/2,
    y: height/2,
    angle: 0,
    speed: 0,
    radius: 10,
    thrust: 0.1,
    friction: 0.99
  };

  // ----- asteroids -----
  const asteroids = [];
  const asteroidCount = 5;
  // ----- stars -----
  const stars = [];
  const starCount = 100;
  function initStars(){
    for(let i=0;i<starCount;i++){
      stars.push({
        x: Math.random()*width,
        y: Math.random()*height,
        radius: Math.random()*1.5 + 0.5
      });
    }
  }
  function initAsteroids(){
    for(let i=0;i<asteroidCount;i++){
      const a = {
        x: Math.random()*width,
        y: Math.random()*height,
        vx: (Math.random()-0.5)*2,
        vy: (Math.random()-0.5)*2,
        radius: 20+Math.random()*30
      };
      asteroids.push(a);
    }
  }

  // ----- input -----
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.code]=true);
  window.addEventListener('keyup',e=>keys[e.code]=false);

  function updateShip(){
    if(keys['ArrowLeft']) ship.angle -= 0.07;
    if(keys['ArrowRight']) ship.angle += 0.07;
    if(keys['ArrowUp']){
      ship.speed += ship.thrust;
      // play thrust sound
      thrustAudio.currentTime = 0;
      thrustAudio.play().catch(()=>{});
    }
    // apply friction
    ship.speed *= ship.friction;
    ship.x += Math.cos(ship.angle)*ship.speed;
    ship.y += Math.sin(ship.angle)*ship.speed;
    // wrap around edges
    if(ship.x<0) ship.x+=width; else if(ship.x>width) ship.x-=width;
    if(ship.y<0) ship.y+=height; else if(ship.y>height) ship.y-=height;
  }

  function updateAsteroids(){
    for(const a of asteroids){
      a.x += a.vx; a.y += a.vy;
      if(a.x<0) a.x+=width; else if(a.x>width) a.x-=width;
      if(a.y<0) a.y+=height; else if(a.y>height) a.y-=height;
    }
  }

  function checkCollision(){
    for(const a of asteroids){
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx,dy);
      if(dist < a.radius + ship.radius){
        // Game over – stop animation
        cancelAnimationFrame(frameId);
        collisionAudio.play().catch(()=>{});
        alert('Game Over');
        return true;
      }
    }
    return false;
  }

  function draw(){
    // dark background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0,0,width,height);
    // draw stars
    ctx.fillStyle = 'white';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    }
    // draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // thrust flame
    if(keys['ArrowUp'] && ship.speed>0){
      ctx.beginPath();
      ctx.moveTo(-12,0);
      ctx.lineTo(-22,-6);
      ctx.lineTo(-22,6);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(15,0);
    ctx.lineTo(-10,10);
    ctx.lineTo(-10,-10);
    ctx.closePath();
    ctx.fillStyle='cyan';
    ctx.fill();
    ctx.strokeStyle='white';
    ctx.lineWidth=1;
    ctx.stroke();
    ctx.restore();
    // draw asteroids with stroke
    ctx.fillStyle='gray';
    ctx.strokeStyle='lightgray';
    ctx.lineWidth=2;
    for(const a of asteroids){
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
    }
  }

  let frameId;
  function loop(){
    updateShip();
    updateAsteroids();
    if(checkCollision()) return;
    draw();
    frameId = requestAnimationFrame(loop);
  }

  initAsteroids();
  loop();
})();
