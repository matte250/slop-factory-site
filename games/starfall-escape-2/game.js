// Simple endless runner based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 400;
  const H = canvas.height = 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBoost(){ playTone(150,0.05); }
  function playCollect(){ playTone(440,0.07); }
  function playExplosion(){ playTone(80,0.3); }

  // Player
  const ship = {x: W/2-15, y: H-60, w:30, h:30, vx:0, vy:0, fuel:100, speed:2, boost:4};

  // Game state
  let asteroids = [];
  let stars = [];
  let particles = [];
  const bgStars = [];
  let score = 0;
  let gameOver = false;
  let frame = 0;
  // Initialize background stars
  for(let i=0;i<120;i++) bgStars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+0.5});

  // Input
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.code]=true; if(e.code==='ArrowUp' && ship.fuel>0){playBoost();}});
  window.addEventListener('keyup',e=>keys[e.code]=false);

  function spawnAsteroid(){
    const size = 20+Math.random()*30;
    asteroids.push({x:Math.random()*(W-size), y:-size, w:size, h:size, speed:1+Math.random()*2});
  }
  function spawnStar(){
    stars.push({x:Math.random()*W, y:-10, r:5, speed:1});
  }

  function update(){
    if(gameOver) return;
    // Controls
    if(keys['ArrowLeft']) ship.vx = -ship.speed;
    else if(keys['ArrowRight']) ship.vx = ship.speed;
    else ship.vx = 0;
    if(keys['ArrowUp'] && ship.fuel>0){
      ship.vy = -ship.boost;
      ship.fuel -= 0.5;
    } else ship.vy = 0;
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(W-ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H-ship.h, ship.y));
    // Fuel consumption
    ship.fuel = Math.max(0, ship.fuel - 0.02);
    if(ship.fuel<=0) gameOver = true;
    // Boost particles
    if(keys['ArrowUp'] && ship.fuel > 0) {
      particles.push({
        x: ship.x + ship.w/2 + (Math.random()-0.5)*10,
        y: ship.y + ship.h + Math.random()*5,
        vx: (Math.random()-0.5)*0.5,
        vy: 1 + Math.random()*1.5,
        life: 30
      });
    }
    // Spawn objects
    if(frame%60===0) spawnAsteroid();
    if(frame%120===0) spawnStar();
    // Update asteroids
    asteroids.forEach(a=> a.y += a.speed);
    asteroids = asteroids.filter(a=> a.y<H);
    // Update stars
    stars.forEach(s=> s.y += s.speed);
    stars = stars.filter(s=> s.y<H);
    // Update background stars (parallax)
    bgStars.forEach(st=> {
      st.y += 0.2;
      if(st.y > H) {
        st.y = 0;
        st.x = Math.random()*W;
      }
    });
    // Update boost particles
    particles.forEach(p=> {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    particles = particles.filter(p=> p.life>0);
    // Collisions
    for(let a of asteroids){
      if(a.x < ship.x+ship.w && a.x+a.w > ship.x && a.y < ship.y+ship.h && a.y+a.h > ship.y){
        gameOver = true; break;
      }
    }
    for(let i=stars.length-1;i>=0;i--){
      const s = stars[i];
      const dx = (s.x) - (ship.x+ship.w/2);
      const dy = (s.y) - (ship.y+ship.h/2);
      if(Math.hypot(dx,dy) < s.r+10){
        score += 10;
        stars.splice(i,1);
      }
    }
    frame++;
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,'#001020');
    bgGrad.addColorStop(1,'#000030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // Ship (draw as triangle with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0044ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Boost flame
    if(keys['ArrowUp'] && ship.fuel > 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.w * 0.2, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w * 0.8, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h + 15);
      ctx.closePath();
      ctx.fill();
    }
    // Asteroids (rotating rocks with gradient)
    asteroids.forEach(a=> {
      ctx.save();
      ctx.translate(a.x + a.w/2, a.y + a.h/2);
      const angle = (a.y/15) % (2*Math.PI);
      ctx.rotate(angle);
      const rockGrad = ctx.createRadialGradient(0,0,a.w/2,0,0,a.w/4);
      rockGrad.addColorStop(0,'#8B7355');
      rockGrad.addColorStop(1,'#5C462F');
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.arc(0,0,a.w/2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    // Stars (twinkling with radial gradient)
    stars.forEach((s,i)=>{
      const alpha = 0.5 + 0.5 * Math.abs(Math.sin((frame + i*10) * 0.1));
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, `rgba(255,255,200,${alpha})`);
      grad.addColorStop(1, `rgba(255,255,150,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // Draw background stars (parallax)
    bgStars.forEach(st=> {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(st.x, st.y, st.r, st.r);
    });
    // Draw boost particles
    particles.forEach(p=> {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.fillRect(p.x, p.y, 2, 2);
    });
    // UI
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    ctx.fillText('Fuel: '+Math.floor(ship.fuel),10,40);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='30px sans-serif';
      ctx.fillText('Game Over',W/2-80,H/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
