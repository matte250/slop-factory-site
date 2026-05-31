// Starlight Runner – simple endless runner
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playCollision(){ playTone(300, 0.1); }
  function playGameOver(){ playTone(100, 0.5); }
  // Thruster sound management
  let thrusterOsc = null;
  function startThruster(){
    if (thrusterOsc) return;
    thrusterOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrusterOsc.type = 'square';
    thrusterOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrusterOsc.connect(gain).connect(audioCtx.destination);
    thrusterOsc.start();
  }
  function stopThruster(){
    if (thrusterOsc){
      thrusterOsc.stop();
      thrusterOsc.disconnect();
      thrusterOsc = null;
    }
  }


  // ship
  const ship = {x: 60, y: H/2, w: 20, h: 12, dy: 0};
  const SHIP_SPEED = 2;

  // asteroids
  const asteroids = [];
  const ASTEROID_FREQ = 90; // frames
  const ASTEROID_SPEED = 3;

  // starfield
  const stars = Array.from({length: 80}, () => ({x: Math.random()*W, y: Math.random()*H, r: Math.random()*2+1, s: Math.random()*0.5+0.2}));

  let frame = 0, hits = 0, gameOver = false;

  function drawShip(){
    // ship with cyan gradient and slight glow
    const grad = ctx.createLinearGradient(ship.x - ship.w, ship.y - ship.h/2, ship.x, ship.y);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,255,255,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w, ship.y - ship.h/2);
    ctx.lineTo(ship.x - ship.w, ship.y + ship.h/2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }

  function updateShip(){
    ship.y += ship.dy;
    ship.y = Math.max(ship.h/2, Math.min(H - ship.h/2, ship.y));
  }

  function spawnAsteroid(){
    const size = Math.random()*20+10;
    asteroids.push({x: W+size, y: Math.random()*H, r: size, passed: false});
  }

  function updateAsteroids(){
    for (let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x -= ASTEROID_SPEED;
      // collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
        if (dist < a.r + Math.max(ship.w, ship.h)/2){
          hits++;
          playCollision();
          asteroids.splice(i,1);
          if (hits>=3){
            gameOver=true;
            playGameOver();
          }
          continue;
        }
      if (a.x < -a.r) asteroids.splice(i,1);
    }
  }

  function drawAsteroids(){
    // asteroids with radial gradient for depth
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff8c00'); // bright core
      grad.addColorStop(1, '#8b4513'); // dark rim
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  function drawStars(){
    // white stars with slight flicker
    stars.forEach(s=>{
      ctx.fillStyle = `rgba(255,255,255,${0.5+Math.random()*0.5})`;
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,2*Math.PI);
      ctx.fill();
      s.x -= s.s; if(s.x<0) s.x=W;
    });
  }

  function loop(){
    if (gameOver){
      ctx.fillStyle = '#000';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
      return;
    }
    ctx.clearRect(0,0,W,H);
    drawStars();
    updateShip();
    drawShip();
    if (frame%ASTEROID_FREQ===0) spawnAsteroid();
    updateAsteroids();
    drawAsteroids();
    frame++;
    requestAnimationFrame(loop);
  }

  // input
  // ensure audio context is running
  window.addEventListener('click',()=>{ if (audioCtx.state !== 'running') audioCtx.resume(); }, {once: true});
  window.addEventListener('keydown',e=>{
    if(e.key==='ArrowUp') ship.dy=-SHIP_SPEED;
    if(e.key==='ArrowDown') ship.dy=SHIP_SPEED;
    if(e.key==='ArrowUp' || e.key==='ArrowDown') startThruster();
  });
  window.addEventListener('keyup',e=>{
    if(e.key==='ArrowUp' && ship.dy<0) ship.dy=0;
    if(e.key==='ArrowDown' && ship.dy>0) ship.dy=0;
    if(e.key==='ArrowUp' || e.key==='ArrowDown') stopThruster();
  });

  loop();
})();
