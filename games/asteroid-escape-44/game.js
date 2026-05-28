// Simple canvas game with enhanced graphics targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Set canvas size (adjust as needed)
  canvas.width = canvas.offsetWidth || 800;
  canvas.height = canvas.offsetHeight || 600;
  
  let x = 50, y = 50; // player position
  const size = 30; // square size
  const speed = 2;
  const keys = {};

  // Starfield background
  const starCount = 100;
  const stars = Array.from({length: starCount},()=>({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    radius: Math.random()*1.5+0.5
  }));

  // Simple particle trail when moving
  const particles = [];

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});

  function playBeep(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }

  function playHit(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  }


  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function update(){
    const prevX = x, prevY = y;
    if(keys.ArrowLeft)  x -= speed;
    if(keys.ArrowRight) x += speed;
    if(keys.ArrowUp)    y -= speed;
    if(keys.ArrowDown)  y += speed;
    // Detect and sound collisions with bounds before clamping
    let collided = false;
    if(x < 0 || x > canvas.width - size){ playHit(); collided = true; }
    if(y < 0 || y > canvas.height - size){ playHit(); collided = true; }
    // Keep inside bounds
    x = Math.max(0, Math.min(canvas.width - size, x));
    y = Math.max(0, Math.min(canvas.height - size, y));
    // Emit particle if moved
    if(x !== prevX || y !== prevY){
      particles.push({x: prevX + size/2, y: prevY + size/2, life: 30});
      // play beep on movement
      playBeep();
    }
    // Update particles life
    for(let i = particles.length-1; i>=0; i--){
      particles[i].life--;
      if(particles[i].life <= 0) particles.splice(i,1);
    }
  }

  function draw(){
    // Background gradient (space nebula)
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0, '#001028');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Draw starfield
    ctx.fillStyle = 'white';
    for(const star of stars){
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI*2);
      ctx.fill();
    }
    // Fade overlay for motion trails
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Draw particles (trail)
    for(const p of particles){
      const alpha = p.life/30;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fill();
    }
    // Draw player with glow
    ctx.shadowColor = '#ffdd57';
    ctx.shadowBlur = 15;
    const gradient = ctx.createRadialGradient(x+size/2, y+size/2, size/4, x+size/2, y+size/2, size/2);
    gradient.addColorStop(0, '#ffdd57');
    gradient.addColorStop(1, '#e67e22');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x+size/2, y+size/2, size/2, 0, Math.PI*2);
    ctx.fill();
    // Reset shadow for other drawing
    ctx.shadowBlur = 0;
  }

  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
