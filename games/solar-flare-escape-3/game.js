// Solar Flare Escape game – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // starfield for background
  const stars = [];
  (function initStars(){
    for(let i=0;i<120;i++){
      stars.push({x: Math.random()*W, y: Math.random()*H, size: Math.random()*2+1});
    }
  })();
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  function playCollision(){ playBeep(150, 400); }
  function playFuel(){ playBeep(600, 150); }

  // ship
  const ship = { x: W/2, y: H-60, w: 30, h: 30, speed: 4, fuel: 100 };

  // flares & fuel cells
  const flares = [];
  const fuels = [];
  let frame = 0, gameOver = false;

  // input
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnFlare() {
    const size = 20 + Math.random()*30;
    flares.push({ x: Math.random()* (W - size), y: -size, w: size, h: size, v: 2 + Math.random()*2 });
  }
  function spawnFuel() {
    const size = 15;
    fuels.push({ x: Math.random()* (W - size), y: -size, w: size, h: size, v: 2 });
  }

  function update() {
    if (gameOver) return;
    frame++;
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W-ship.w, ship.x));
    // fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) gameOver = true;
    // spawn objects
    if (frame % 80 === 0) spawnFlare();
    if (frame % 300 === 0) spawnFuel();
    // update flares
    flares.forEach(f => f.y += f.v);
    fuels.forEach(f => f.y += f.v);
    // remove off‑screen
    while (flares.length && flares[0].y > H) flares.shift();
    while (fuels.length && fuels[0].y > H) fuels.shift();
    // collisions
    for (let i = flares.length-1; i>=0; i--) {
      const f = flares[i];
      if (rectCollide(ship, f)) { playCollision(); gameOver = true; break; }
    }
    for (let i = fuels.length-1; i>=0; i--) {
      const f = fuels[i];
      if (rectCollide(ship, f)) { playFuel(); ship.fuel = Math.min(100, ship.fuel + 30); fuels.splice(i,1); }
    }
    draw();
    if (!gameOver) requestAnimationFrame(update);
    else drawGameOver();
  }

  function rectCollide(a,b){return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;}

  // draw starfield background
  function drawStars(){
    ctx.fillStyle = '#fff';
    stars.forEach(s=>{
      ctx.globalAlpha = Math.random()*0.5 + 0.5; // random twinkle
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;
  }

  function draw(){
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,H);
    drawStars();
    // ship as triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // flares with radial gradient
    flares.forEach(f=>{
      const grad = ctx.createRadialGradient(f.x+f.w/2, f.y+f.h/2, 0, f.x+f.w/2, f.y+f.h/2, f.w/2);
      grad.addColorStop(0, 'rgba(255,140,0,0.8)');
      grad.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x,f.y,f.w,f.h);
    });
    // fuel cells as glowing circles
    fuels.forEach(f=>{
      const grad = ctx.createRadialGradient(f.x+f.w/2, f.y+f.h/2, 0, f.x+f.w/2, f.y+f.h/2, f.w/2);
      grad.addColorStop(0, 'rgba(0,255,0,0.9)');
      grad.addColorStop(1, 'rgba(0,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x+f.w/2, f.y+f.h/2, f.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // fuel meter
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: '+Math.floor(ship.fuel),10,20);
  }

  function drawGameOver(){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', W/2, H/2);
  }

  update();
})();
