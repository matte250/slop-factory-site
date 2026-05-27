// Astro Dodge game implementation
// Assumes a <canvas id="game"></canvas> in the HTML.
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or use defaults
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  // Create starfield for background
  const stars = [];
  const STAR_COUNT = 100;
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*1.5+0.5
    });
  }

  const ship = { w: 40, h: 20, x: canvas.width/2 - 20, y: canvas.height - 30, speed: 4 };
  const keys = { left: false, right: false };
  const asteroids = [];
  let asteroidTimer = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  // Create AudioContext for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a beep
  function playBeep(freq, duration = 100) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Resume AudioContext on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('keydown', resumeAudio);

  window.addEventListener('keydown', e => {
    if(e.key==='ArrowLeft' || e.key==='a') keys.left = true;
    if(e.key==='ArrowRight' || e.key==='d') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if(e.key==='ArrowLeft' || e.key==='a') keys.left = false;
    if(e.key==='ArrowRight' || e.key==='d') keys.right = false;
  });

  function spawnAsteroid(){
    const size = Math.random()*30+20;
    const x = Math.random()*(canvas.width-size);
    const speed = Math.random()*2+1;
    asteroids.push({x, y:-size, w:size, h:size, speed});
    // sound for new asteroid
    playBeep(300, 80);
  }

  function update(){
    if(gameOver) return;
    // Move ship
    if(keys.left) ship.x = Math.max(0, ship.x - ship.speed);
    if(keys.right) ship.x = Math.min(canvas.width-ship.w, ship.x + ship.speed);
    // Add asteroids over time
    asteroidTimer++;
    if(asteroidTimer > 60){ // roughly one per second at 60fps
      spawnAsteroid();
      asteroidTimer = 0;
    }
    // Update stars for simple scrolling effect
    const STAR_SPEED = 0.5;
    for(let s of stars){
      s.y += STAR_SPEED;
      if(s.y > canvas.height){
        s.y = 0;
        s.x = Math.random()*canvas.width;
      }
    }
    // Update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.y += a.speed;
      // Collision detection
      if(a.x < ship.x+ship.w && a.x+a.w > ship.x && a.y < ship.y+ship.h && a.y+a.h > ship.y){
        // collision sound
        playBeep(600, 200);
        gameOver = true;
      }
      // Remove off‑screen asteroids and increase score
      if(a.y > canvas.height){
        asteroids.splice(i,1);
        score++;
      }
    }
  }

  function draw(){
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s=>{
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // Draw ship as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.2, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#a33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
