// Meteor Dodge – enhanced graphics with sound effects
// Requires a <canvas id="game"></canvas> in the HTML.
(function(){
  const canvas = document.getElementById('game');
  // Audio setup – simple tone generator using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed after first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  if(!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Ensure canvas fills its CSS size
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  const ship = {w:30, h:20, x:canvas.width/2, y:canvas.height-30, speed:4};
  const keys = {};
  const meteors = [];
  const laser = {active:false, x:0, y:0, speed:6};
  let score = 0;
  let gameOver = false;
  let meteorTimer = 0;

  // Input handling
  window.addEventListener('keydown',e=>{keys[e.code]=true; if(e.code==='Space') fireLaser();});
  window.addEventListener('keyup',e=>{keys[e.code]=false;});

  function fireLaser(){
    if(laser.active) return;
    laser.active = true;
    laser.x = ship.x + ship.w/2;
    laser.y = ship.y;
    // laser fire sound
    playTone(800, 0.1);
  }

  function spawnMeteor(){
    const size = Math.random()*20+10; // diameter
    meteors.push({x:Math.random()*(canvas.width-size), y:-size, r:size, speed:1+Math.random()*2});
  }

  function update(){
    if(gameOver) return;
    // Ship movement
    if(keys['ArrowLeft'] && ship.x>0) ship.x -= ship.speed;
    if(keys['ArrowRight'] && ship.x+ship.w<canvas.width) ship.x += ship.speed;
    if(keys['ArrowUp'] && ship.y>0) ship.y -= ship.speed;
    if(keys['ArrowDown'] && ship.y+ship.h<canvas.height) ship.y += ship.speed;

    // Laser motion
    if(laser.active){
      laser.y -= laser.speed;
      if(laser.y < 0) laser.active = false;
    }

    // Meteors logic
    meteorTimer--;
    if(meteorTimer<=0){
      spawnMeteor();
      // spawn faster as score rises
      meteorTimer = Math.max(30, 120 - Math.floor(score/5));
    }
    for(let i=meteors.length-1;i>=0;i--){
      const m = meteors[i];
      m.y += m.speed;
      // Ship collision → game over
      if(m.x < ship.x+ship.w && m.x+m.r > ship.x && m.y < ship.y+ship.h && m.y+m.r > ship.y){
        // ship hit – game over sound
        playTone(200, 0.3);
        gameOver = true;
      }
      // Laser hits meteor
      if(laser.active && m.x < laser.x && m.x+m.r > laser.x && m.y < laser.y && m.y+m.r > laser.y){
        meteors.splice(i,1);
        laser.active = false;
        score++;
        continue;
      }
      // Remove off‑screen meteors
      if(m.y - m.r > canvas.height){
        meteors.splice(i,1);
      }
    }
  }

  // Draw a starry background using a gradient
  function drawBackground(){
    const grd = ctx.createLinearGradient(0,0,0,canvas.height);
    grd.addColorStop(0,"#020111");
    grd.addColorStop(1,"#090979");
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // tiny stars
    ctx.fillStyle='white';
    for(let i=0;i<30;i++){
      const sx = Math.random()*canvas.width;
      const sy = Math.random()*canvas.height;
      ctx.fillRect(sx,sy,1,1);
    }
  }

  function draw(){
    drawBackground();
    // Ship – white triangle with thin stroke
    ctx.fillStyle='white';
    ctx.strokeStyle='rgba(255,255,255,0.7)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y+ship.h);
    ctx.lineTo(ship.x+ship.w/2, ship.y);
    ctx.lineTo(ship.x+ship.w, ship.y+ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Laser – glowing red line
    if(laser.active){
      ctx.strokeStyle='rgba(255,0,0,0.8)';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(laser.x, laser.y+12);
      ctx.stroke();
    }
    // Meteors – radial gradient circles
    meteors.forEach(m=>{
      const grad = ctx.createRadialGradient(
        m.x+m.r/2, m.y+m.r/2, m.r*0.2,
        m.x+m.r/2, m.y+m.r/2, m.r/2);
      grad.addColorStop(0,'#555');
      grad.addColorStop(1,'#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x+m.r/2, m.y+m.r/2, m.r/2,0,Math.PI*2);
      ctx.fill();
    });
    // Score – bright text with slight shadow
    ctx.fillStyle='yellow';
    ctx.font='16px sans-serif';
    ctx.shadowColor='black';
    ctx.shadowBlur=2;
    ctx.fillText('Score: '+score,10,20);
    ctx.shadowBlur=0;
    // Game over overlay
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='red';
      ctx.font='30px sans-serif';
      ctx.textAlign='center';
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
