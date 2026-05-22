// Minimalist arcade: Color Capture
// Canvas with id "game" must exist in the HTML.
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  // Set canvas dimensions (fallback if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Brush (controlled by mouse)
  const brush = {x: canvas.width/2, y: canvas.height/2, radius: 20};
  canvas.addEventListener('mousemove', e=>{
    const rect = canvas.getBoundingClientRect();
    brush.x = e.clientX - rect.left;
    brush.y = e.clientY - rect.top;
  });

  // Blob definition
  class Blob {
    constructor(){
      this.radius = 15;
      this.x = Math.random()*canvas.width;
      this.y = Math.random()*canvas.height;
      this.vx = (Math.random()-0.5)*2;
      this.vy = (Math.random()-0.5)*2;
      this.color = `hsl(${Math.random()*360},70%,50%)`;
      this.spawnTime = performance.now();
      this.captured = false;
    }
    update(dt){
      this.x += this.vx*dt;
      this.y += this.vy*dt;
      // Bounce off edges
      if(this.x<0||this.x>canvas.width) this.vx*=-1;
      if(this.y<0||this.y>canvas.height) this.vy*=-1;
    }
    draw(){
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius*0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, this.captured ? '#555' : this.color);
      grad.addColorStop(1, this.captured ? '#222' : '#000');
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    isOverlapping(){
      const dx = this.x - brush.x;
      const dy = this.y - brush.y;
      const dist = Math.hypot(dx,dy);
      return dist < this.radius + brush.radius;
    }
    expired(now){
      return (now - this.spawnTime) > 3000 && !this.captured;
    }
  }

  const blobs = [];
  const particles = [];
  let lastTime = performance.now();
  let gameOver = false;

  function spawnBlob(){
    if (blobs.length<10) blobs.push(new Blob());
  }

  function update(){
    if(gameOver) return;
    const now = performance.now();
    const dt = (now - lastTime)/16; // normalize to ~60fps units
    lastTime = now;
    // spawn a new blob every second
    if (Math.floor(now/1000) !== Math.floor((now-dt*16)/1000)) spawnBlob();
    // update blobs
    for(const b of blobs){
      b.update(dt);
      if(!b.captured && b.isOverlapping()){
          b.captured = true;
          // play capture sound
          playTone(440, 0.08);
          // create burst of particles at capture point
          for(let i=0;i<12;i++){
            const angle = Math.random()*Math.PI*2;
            const speed = Math.random()*2+1;
            particles.push({
              x: b.x,
              y: b.y,
              vx: Math.cos(angle)*speed,
              vy: Math.sin(angle)*speed,
              size: Math.random()*3+2,
              color: b.captured ? '#aaa' : b.color,
              alpha: 1
            });
          }
        }
    }
    // check lose condition
    for(const b of blobs){
      if(b.expired(now)) { gameOver = true; break; }
    }
  }

  function draw(){
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#08080f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // draw brush with glow
    ctx.beginPath();
    ctx.arc(brush.x,brush.y,brush.radius,0,Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    // draw particles (if any)
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fill();
      // update particle
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
      if(p.alpha<=0) particles.splice(i,1);
    }
    ctx.globalAlpha = 1;
    // draw blobs with radial gradient
    for(const b of blobs){
      if(!b.captured) b.draw();
    }
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
