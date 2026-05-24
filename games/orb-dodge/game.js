// Orb Dodge with enhanced graphics and sound
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});

  // Simple beep function
  function playBeep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Pre‑generated starfield background
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({x: Math.random()*width, y: Math.random()*height, r: Math.random()*1.5+0.5});
  }

  // Ship (player) – a small triangle
  const ship = {x: width/2, y: height/2, r: 10, speed: 3, angle: 0};

  // Orbs array with gradient colors
  const orbs = [];
  const orbCount = 5;
  const orbColors = ['#ff6b6b', '#ff8787', '#ff9c9c', '#ffb5b5', '#ffcdcd'];
  for(let i=0;i<orbCount;i++){
    orbs.push({
      x: Math.random()*width,
      y: Math.random()*height,
      r: 15,
      vx: (Math.random()*2-1)*2,
      vy: (Math.random()*2-1)*2,
      color: orbColors[i % orbColors.length]
    });
  }

  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  // Input handling – arrow keys
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function update(dt){
    // Movement and rotation based on input
    if(keys['ArrowUp']) ship.y -= ship.speed;
    if(keys['ArrowDown']) ship.y += ship.speed;
    if(keys['ArrowLeft']) ship.x -= ship.speed;
    if(keys['ArrowRight']) ship.x += ship.speed;
    // Rotate ship towards movement direction for visual effect
    ship.angle = Math.atan2(
      (keys['ArrowDown']?1:0)-(keys['ArrowUp']?1:0),
      (keys['ArrowRight']?1:0)-(keys['ArrowLeft']?1:0)
    );
    // Keep ship inside canvas
    ship.x = Math.max(ship.r, Math.min(width-ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(height-ship.r, ship.y));

    // Move orbs
    for(const o of orbs){
      o.x += o.vx;
      o.y += o.vy;
      // Bounce off walls
      if(o.x<o.r||o.x>width-o.r) o.vx*=-1;
      if(o.y<o.r||o.y>height-o.r) o.vy*=-1;
      // Collision with ship
      const dx = o.x-ship.x, dy=o.y-ship.y;
      const dist = Math.hypot(dx, dy);
      if(dist<o.r+ship.r){
        gameOver=true;
      }
    }
    if(!gameOver) score += dt/1000; // seconds
  }

  function drawBackground(){
    // Space gradient
    const grad = ctx.createLinearGradient(0,0,width,height);
    grad.addColorStop(0,"#0d0d25");
    grad.addColorStop(1,"#001133");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);
    // Stars
    ctx.fillStyle = '#ffffff';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function drawShip(){
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#00ff99';
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r*0.8, ship.r);
    ctx.lineTo(-ship.r*0.8, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawOrbs(){
    for(const o of orbs){
      const grad = ctx.createRadialGradient(o.x, o.y, o.r*0.2, o.x, o.y, o.r);
      grad.addColorStop(0, o.color);
      grad.addColorStop(1, '#660000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function draw(){
    drawBackground();
    drawShip();
    drawOrbs();
    // Score
    ctx.fillStyle='yellow';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score.toFixed(1), 10, 20);
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle='white';
      ctx.font='30px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(!gameOver){
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
