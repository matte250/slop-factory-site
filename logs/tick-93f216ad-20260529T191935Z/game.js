// Minimal Space Debris Dodger game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;
  // ---- Audio setup ----
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+duration);
    osc.start();
    osc.stop(audioCtx.currentTime+duration);
  }
  // laser shot
  function soundLaser(){ playTone(400,0.08); }
  // explosion (short noise burst)
  function soundExplosion(){
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/bufferSize,2);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime+0.2);
  }
  // hit (lower tone)
  function soundHit(){ playTone(200,0.2); }
  // game over (descending tone)
  function soundGameOver(){ playTone(150,0.5); }


  // ---- Game objects ----
  const ship = { x: W/2, y: H-30, w: 30, h: 15, speed: 4, health: 3 };
  const bullets = [];
  const debris = [];
  // starfield background
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.5});
  }

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => keys[e.code] = false);

  // ---- Helpers ----
  function rect(o) { return {x:o.x, y:o.y, w:o.w, h:o.h}; }
  function intersect(a,b) {
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  // ---- Game loop ----
  let frames = 0;
  function loop(){
    // move ship
    if(keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if(keys['ArrowRight']) ship.x = Math.min(W-ship.w, ship.x + ship.speed);
    if(keys['Space']) {
      // fire rate limit
      if(frames % 10 === 0){
        bullets.push({x: ship.x+ship.w/2-2, y: ship.y, w:4, h:10, speed:6});
        soundLaser();
      }
    }
    // update bullets
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.y -= b.speed;
      if(b.y < -b.h) bullets.splice(i,1);
    }
    // spawn debris
    if(frames % Math.max(30, 120 - ship.health*20) === 0) {
      const size = 20 + Math.random()*15;
      debris.push({
        x: Math.random()*(W-size),
        y: -size,
        w: size,
        h: size,
        speed: 2+Math.random()*2,
        angle: Math.random()*Math.PI*2,
        rotSpeed: (Math.random()-0.5)*0.1
      });
    }
    // update debris
    for(let i=debris.length-1;i>=0;i--){
      const d=debris[i];
      d.y += d.speed;
      d.angle += d.rotSpeed;
      // collision with ship
      if(intersect(rect(d), rect(ship))) { soundHit(); ship.health--; debris.splice(i,1); }
      // collision with bullets
      for(let j=bullets.length-1;j>=0;j--){
        if(intersect(rect(d), rect(bullets[j]))) { soundExplosion(); debris.splice(i,1); bullets.splice(j,1); break; }
      }
      // remove off‑screen
      if(d.y>H) debris.splice(i,1);
    }
    // draw
    // background: black with stars
    ctx.fillStyle='black';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});
    // ship: draw as triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // bullets
    ctx.fillStyle='lime';
    bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));
    // debris: draw rotating rectangles with gradient
    debris.forEach(d=>{
      ctx.save();
      ctx.translate(d.x + d.w/2, d.y + d.h/2);
      ctx.rotate(d.angle);
      const grad = ctx.createLinearGradient(-d.w/2, -d.h/2, d.w/2, d.h/2);
      grad.addColorStop(0, '#ff4444');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);
      ctx.restore();
    });
    // health
    ctx.fillStyle='yellow';
    ctx.font='16px monospace';
    ctx.fillText('Health: '+ship.health,10,20);

    if(ship.health>0) {
      frames++;
      requestAnimationFrame(loop);
    } else {
      soundGameOver();
      ctx.fillStyle='white';
      ctx.textAlign='center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }
  requestAnimationFrame(loop);
})();
