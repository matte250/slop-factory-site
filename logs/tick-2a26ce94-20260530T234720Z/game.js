// Meteor Shower Escape – minimal implementation
(function(){
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio can start after user interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once:true});
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration/1000);
    osc.start(now);
    osc.stop(now + duration/1000);
  }

  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Ensure canvas size (fallback to 800x600)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const ship = { width: 40, height: 20, x: canvas.width/2, y: canvas.height-30, speed: 6 };
  let moveLeft = false, moveRight = false;
  const meteors = [];
  const stars = []; // pre‑generated starfield
  // generate starfield once
  (function generateStars(){
    const starCount = 120;
    for(let i=0;i<starCount;i++){
      stars.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        size: Math.random()*2+0.5,
        alpha: Math.random()*0.5+0.5
      });
    }
  })();
  let lastSpawn = 0, spawnInterval = 1500; // ms
  let startTime = performance.now();
  let gameOver = false;
  let score = 0;

  // Input handling
  window.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft'){ moveLeft=true; playTone(180,60); } if(e.key==='ArrowRight'){ moveRight=true; playTone(180,60); } });
  window.addEventListener('keyup', e=>{ if(e.key==='ArrowLeft') moveLeft=false; if(e.key==='ArrowRight') moveRight=false; });

  function spawnMeteor(){
    const radius = Math.random()*15+10;
    const speed = Math.random()*2+1 + (performance.now()-startTime)/60000; // increase over time
    meteors.push({ x: Math.random()*canvas.width, y: -radius, r: radius, dy: speed });
    // play spawn sound (high‑pitched swoosh)
    playTone(300 + Math.random()*200, 80);
  }

  function update(dt){
    // Ship movement
    if(moveLeft) ship.x -= ship.speed;
    if(moveRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width-ship.width, ship.x));

    // Spawn meteors
    if(performance.now() - lastSpawn > spawnInterval){
      spawnMeteor();
      lastSpawn = performance.now();
      // gradually increase difficulty
      spawnInterval = Math.max(300, spawnInterval*0.98);
    }

    // Update meteors
    for(let i=meteors.length-1;i>=0;i--){
      const m = meteors[i];
      m.y += m.dy;
      // collision with ship (simple AABB vs circle)
      const shipRect = {x: ship.x, y: ship.y, w: ship.width, h: ship.height};
      const distX = Math.abs(m.x - (shipRect.x + shipRect.w/2));
      const distY = Math.abs(m.y - (shipRect.y + shipRect.h/2));
      if(distX > (shipRect.w/2 + m.r) || distY > (shipRect.h/2 + m.r)) {
        // no collision
        } else {
          // collision detected
          gameOver = true;
          // collision sound: low note
          playTone(100, 300);
        }
      // remove off‑screen meteors
      if(m.y - m.r > canvas.height) meteors.splice(i,1);
    }

    // Update score
    score = Math.floor((performance.now() - startTime)/1000);
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // pre‑generated starfield with twinkling
    stars.forEach(star => {
      // slight flicker
      star.alpha += (Math.random()-0.5)*0.02;
      star.alpha = Math.max(0.3, Math.min(1, star.alpha));
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    // ship (gradient triangle with outline)
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.height);
    shipGrad.addColorStop(0, '#00ff7f');
    shipGrad.addColorStop(1, '#006400');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width/2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // ship outline glow
    ctx.strokeStyle = 'rgba(0,255,127,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // meteors with radial gradient
    meteors.forEach(m=>{
      const grad = ctx.createRadialGradient(m.x, m.y, m.r*0.2, m.x, m.y, m.r);
      grad.addColorStop(0, '#ffae42');
      grad.addColorStop(1, '#c1440e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI*2);
      ctx.fill();
      // optional glow effect
      ctx.shadowColor = 'rgba(255,140,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    // game over overlay
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: '+score, canvas.width/2, canvas.height/2+40);
    }
  }

  let lastTime = 0;
  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(!gameOver){
      update(dt);
    }
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
