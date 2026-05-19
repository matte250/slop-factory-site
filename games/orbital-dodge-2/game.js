// Orbital Dodge game
// Canvas with id "game" must exist in the HTML.
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  let bgOsc = null;
  function startBackground(){
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 60; // low hum
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    bgOsc.connect(gain);
    gain.connect(audioCtx.destination);
    bgOsc.start();
  }
  function stopBackground(){
    if (bgOsc){ bgOsc.stop(); bgOsc = null; }
  }
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollision(){ playTone(200, 0.3); }
  function playPickup(){ playTone(800, 0.1); }
  startBackground();

  // Game parameters
  const planet = {x: W/2, y: H/2, r: 30, color: '#4a6'};
  // background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
      color: '#777'
    });
  }
  const ship = {orbitR: 100, angle: 0, speed: 0.03, r: 8, color: '#ff0'};
  const asteroids = [];
  const fuels = [];
  let fuel = 100; // seconds
  let lastTime = 0;
  let gameOver = false;

  function spawnAsteroid(){
    const beltR = 150 + Math.random()*150; // distance from planet
    const angle = Math.random()*Math.PI*2;
    const speed = 0.01 + Math.random()*0.03; // rotation speed
    const size = 10 + Math.random()*15;
    asteroids.push({beltR, angle, speed, size, color: '#a33'});
  }

  function spawnFuel(){
    const beltR = 100 + Math.random()*200;
    const angle = Math.random()*Math.PI*2;
    fuels.push({beltR, angle, r:6, color:'#0af'});
  }

  function update(dt){
    if (gameOver) return;
    // ship orbit controlled by arrow keys
    if (keys['ArrowLeft']) ship.angle -= ship.speed*dt;
    if (keys['ArrowRight']) ship.angle += ship.speed*dt;
    // consume fuel over time
    fuel -= dt*0.02;
    if (fuel <= 0) gameOver = true;

    // update asteroids rotation
    asteroids.forEach(a=> a.angle += a.speed*dt);
    // spawn logic
    if (Math.random() < dt*0.001) spawnAsteroid();
    if (Math.random() < dt*0.0003) spawnFuel();

    // collision detection
    const shipX = planet.x + Math.cos(ship.angle)*ship.orbitR;
    const shipY = planet.y + Math.sin(ship.angle)*ship.orbitR;
    for (let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      const ax = planet.x + Math.cos(a.angle)*a.beltR;
      const ay = planet.y + Math.sin(a.angle)*a.beltR;
      const dx = shipX-ax, dy = shipY-ay;
      if (dx*dx+dy*dy < (ship.r+a.size)**2) { gameOver=true; playCollision(); break; }
    }
    for (let i=fuels.length-1;i>=0;i--){
      const f = fuels[i];
      const fx = planet.x + Math.cos(f.angle)*f.beltR;
      const fy = planet.y + Math.sin(f.angle)*f.beltR;
      const dx = shipX-fx, dy = shipY-fy;
      if (dx*dx+dy*dy < (ship.r+f.r)**2){
        fuel = Math.min(100, fuel+30);
        fuels.splice(i,1);
        playPickup();
      }
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // background stars
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,W,H);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // planet with gradient and shadow
    const planetGrad = ctx.createRadialGradient(
      planet.x,
      planet.y,
      planet.r * 0.2,
      planet.x,
      planet.y,
      planet.r
    );
    planetGrad.addColorStop(0, '#aaffaa');
    planetGrad.addColorStop(1, planet.color);
    ctx.save();
    ctx.shadowColor = '#4a6';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fillStyle = planetGrad;
    ctx.fill();
    ctx.restore();
    // ship with gradient and cone tip
    const sx = planet.x + Math.cos(ship.angle)*ship.orbitR;
    const sy = planet.y + Math.sin(ship.angle)*ship.orbitR;
    // gradient for ship body
    const shipGrad = ctx.createRadialGradient(
      sx, sy, ship.r * 0.2,
      sx, sy, ship.r
    );
    shipGrad.addColorStop(0, '#ffffaa');
    shipGrad.addColorStop(1, ship.color);
    ctx.save();
    ctx.shadowColor = ship.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, ship.r, 0, Math.PI * 2);
    ctx.fillStyle = shipGrad;
    ctx.fill();
    // draw a simple triangular nose pointing forward
    const noseLength = ship.r * 1.8;
    const nx = sx + Math.cos(ship.angle) * noseLength;
    const ny = sy + Math.sin(ship.angle) * noseLength;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(nx, ny);
    ctx.lineTo(
      sx + Math.cos(ship.angle + Math.PI * 0.8) * ship.r * 0.6,
      sy + Math.sin(ship.angle + Math.PI * 0.8) * ship.r * 0.6
    );
    ctx.lineTo(
      sx + Math.cos(ship.angle - Math.PI * 0.8) * ship.r * 0.6,
      sy + Math.sin(ship.angle - Math.PI * 0.8) * ship.r * 0.6
    );
    ctx.closePath();
    ctx.fillStyle = ship.color;
    ctx.fill();
    ctx.restore();
    // asteroids with gradient and shadow
    asteroids.forEach(a=>{
      const ax = planet.x + Math.cos(a.angle)*a.beltR;
      const ay = planet.y + Math.sin(a.angle)*a.beltR;
      const grad = ctx.createRadialGradient(
        ax, ay, a.size * 0.2,
        ax, ay, a.size
      );
      grad.addColorStop(0, '#ffaaa0');
      grad.addColorStop(1, a.color);
      ctx.save();
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });
    // fuels
    fuels.forEach(f=>{
      const fx = planet.x + Math.cos(f.angle)*f.beltR;
      const fy = planet.y + Math.sin(f.angle)*f.beltR;
      ctx.beginPath();
      ctx.arc(fx,fy,f.r,0,Math.PI*2);
      ctx.fillStyle=f.color;ctx.fill();
    });
    // UI
    // fuel bar background
    const barWidth = 200;
    const barHeight = 12;
    const barX = 10;
    const barY = 10;
    ctx.fillStyle = '#444';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // fuel level
    const fuelRatio = Math.max(0, Math.min(1, fuel / 100));
    ctx.fillStyle = '#0f0';
    ctx.fillRect(barX, barY, barWidth * fuelRatio, barHeight);
    // fuel text
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Fuel: ' + Math.round(fuel), barX + barWidth + 5, barY + barHeight - 2);
    if (gameOver){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff';
      ctx.font='30px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }

  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function loop(timestamp){
    const dt = timestamp - lastTime; lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
