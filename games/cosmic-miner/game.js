// Cosmic Miner – concise canvas game
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  const sounds = {
    collect: () => playTone(600, 100),
    fire: () => playTone(300, 80),
    hit: () => playTone(100, 200),
    gameOver: () => { for(let i=0;i<3;i++) setTimeout(()=>playTone(150,200), i*200); }
  };

  // ----- state -----
  const ship = {x: W/2, y: H/2, r: 10, vx:0, vy:0, speed:0.3, shield:5, score:0};
  const keys = {};
  const asteroids = [];
  const turrets = [];
  const bullets = [];

  // ----- utilities -----
  function rand(min, max) {return Math.random() * (max - min) + min;}
  function dist(a,b) {return Math.hypot(a.x-b.x, a.y-b.y);}

  // ----- input -----
  window.addEventListener('keydown', e=>{ if (audioCtx.state === 'suspended') audioCtx.resume(); keys[e.key]=true; });
  window.addEventListener('keyup', e=>keys[e.key]=false);

  // ----- entity creators -----
  function spawnAsteroid(){
    const side = Math.floor(rand(0,4));
    const pos = [{x:0,y:rand(0,H)},{x:W,y:rand(0,H)},{x:rand(0,W),y:0},{x:rand(0,W),y:H}][side];
    const vel = {x: rand(-0.5,0.5), y: rand(-0.5,0.5) };
    asteroids.push({x:pos.x, y:pos.y, r:rand(8,15), vx:vel.x, vy:vel.y});
  }
  function spawnTurret(){
    const x = rand(50, W-50), y = rand(50, H-50);
    turrets.push({x, y, r:12, cooldown:0});
  }
  // initial spawns
  for(let i=0;i<5;i++) spawnAsteroid();
  for(let i=0;i<2;i++) spawnTurret();

  // ----- main loop -----
  let last = performance.now();
  let gameOver = false;
  // generate static star field (once)
  const stars = Array.from({length: 80}, () => ({x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.5}));
  function update(now){
    const dt = (now - last)/16; // approx 60fps scale
    last = now;
    if(gameOver) {draw(); return;}
    // ship control
    ship.vx += (keys['ArrowRight']?1:0 - (keys['ArrowLeft']?1:0)) * ship.speed;
    ship.vy += (keys['ArrowDown']?1:0 - (keys['ArrowUp']?1:0)) * ship.speed;
    ship.x = (ship.x + ship.vx*dt + W) % W;
    ship.y = (ship.y + ship.vy*dt + H) % H;
    ship.vx *= 0.98; ship.vy *= 0.98; // friction

    // asteroids movement & collision
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x = (a.x + a.vx*dt + W) % W;
      a.y = (a.y + a.vy*dt + H) % H;
      if(dist(a, ship) < a.r + ship.r){
        ship.score += 1;
        sounds.collect();
        asteroids.splice(i,1);
        spawnAsteroid();
      }
    }

    // turrets fire
    turrets.forEach(t=>{
      if(t.cooldown<=0){
        const angle = Math.atan2(ship.y - t.y, ship.x - t.x);
        const speed = 2.5;
        bullets.push({x:t.x, y:t.y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, r:3});
        sounds.fire();
        t.cooldown = 90; // frames
      } else t.cooldown--;
    });

    // bullets movement & collision
    for(let i=bullets.length-1;i>=0;i--){
      const b = bullets[i];
      b.x = (b.x + b.vx*dt + W) % W;
      b.y = (b.y + b.vy*dt + H) % H;
      if(dist(b, ship) < b.r + ship.r){
        ship.shield--;
        sounds.hit();
        bullets.splice(i,1);
        if(ship.shield<=0){
          gameOver=true;
          sounds.gameOver();
        }
      }
    }

    draw();
    requestAnimationFrame(update);
  }

function draw(){
  ctx.clearRect(0,0,W,H);

  // star field (static)
  ctx.fillStyle='white';
  stars.forEach(s=>{ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();});

  // ship with gradient triangle
  const angle = Math.atan2(ship.vy, ship.vx) || 0;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(angle);
  const grad = ctx.createRadialGradient(0,0,0,0,0,ship.r);
  grad.addColorStop(0,'#00ffff');
  grad.addColorStop(1,'#003366');
  ctx.fillStyle=grad;
  ctx.beginPath();
  ctx.moveTo(ship.r,0);
  ctx.lineTo(-ship.r*0.6, ship.r*0.6);
  ctx.lineTo(-ship.r*0.6, -ship.r*0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // asteroids with rough polygon gradient
  asteroids.forEach(a=>{
    const aGrad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
    aGrad.addColorStop(0,'#777777');
    aGrad.addColorStop(1,'#222222');
    ctx.fillStyle=aGrad;
    ctx.beginPath();
    // simple 6‑point polygon
    for(let i=0;i<6;i++){
      const theta = (i/6)*Math.PI*2;
      const radius = a.r * (0.7 + Math.random()*0.3);
      const x = a.x + Math.cos(theta)*radius;
      const y = a.y + Math.sin(theta)*radius;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
  });

  // turrets with base and barrel
  ctx.fillStyle='darkred';
  turrets.forEach(t=>{
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r,0,Math.PI*2);
    ctx.fill();
    // barrel pointing at ship
    const a = Math.atan2(ship.y - t.y, ship.x - t.x);
    ctx.strokeStyle='red';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + Math.cos(a)*t.r*1.5, t.y + Math.sin(a)*t.r*1.5);
    ctx.stroke();
  });

  // bullets with glow
  bullets.forEach(b=>{
    const bGrad = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
    bGrad.addColorStop(0,'rgba(255,255,0,1)');
    bGrad.addColorStop(1,'rgba(255,255,0,0)');
    ctx.fillStyle=bGrad;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
  });

  // HUD
  ctx.fillStyle='white';
  ctx.font='14px sans-serif';
  ctx.fillText(`Score: ${ship.score}`,10,20);
  ctx.fillText(`Shield: ${ship.shield}`,10,40);
  if(gameOver){
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';
    ctx.textAlign='center';
    ctx.font='36px sans-serif';
    ctx.fillText('Game Over', W/2, H/2);
  }
}

  requestAnimationFrame(update);
})();
