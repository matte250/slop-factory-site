// Simple Space Junk Collector game
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  const player = {x: width/2, y: height/2, r: 12, speed: 4, fuel: 100, alive:true};
  const debris = [];
  const asteroids = [];
  let score = 0;
  let lastSpawn = 0;
  let lastThrust = 0; // timestamp for thrust sound
  // create starfield
  const stars = [];
  const STAR_COUNT = 100;
  for (let i=0;i<STAR_COUNT;i++){
    stars.push({x: Math.random()*width, y: Math.random()*height, size: Math.random()*2+1});
  }
  const SPAWN_INTERVAL = 1200; // ms

  // Input handling and audio init
  const keys = {};
  let audioCtx;
  function initAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, duration){
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration/1000);
    osc.start();
    osc.stop(audioCtx.currentTime+duration/1000);
  }
  function playCollect(){ playTone(800, 100); }
  function playExplosion(){ playTone(150, 300); }
  function playThrust(){ playTone(400, 80); }

  window.addEventListener('keydown', e => { keys[e.key] = true; initAudio(); });
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
    initAudio();
  });
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  function spawn() {
    // Debris (small points)
    debris.push({x: Math.random()*width, y: -10, r: 6, vy: 1.5 + Math.random()*1.5});
    // Asteroid (danger)
    asteroids.push({x: Math.random()*width, y: -20, r: 18, vy: 2 + Math.random()*1});
  }

  function update(dt) {
    // move starfield (parallax)
    stars.forEach(s=>{s.y+=0.2; if(s.y>height){s.y=0; s.x=Math.random()*width;}});
    // play thrust sound when thrusting
    if ((keys.ArrowUp || keys[' ']) && performance.now()-lastThrust>100){
      playThrust();
      lastThrust=performance.now();
    }
    // move starfield (parallax)
    stars.forEach(s=>{s.y+=0.2; if(s.y>height){s.y=0; s.x=Math.random()*width;}});
    if (!player.alive) return;
    // fuel drain
    player.fuel -= dt * 0.02; // 2% per sec
    if (player.fuel <= 0) { player.alive = false; return; }

    // keyboard fallback movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;

    // keep inside bounds
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));

    // move objects
    debris.forEach(d => d.y += d.vy);
    asteroids.forEach(a => a.y += a.vy);

    // collision detection
    for (let i = debris.length-1; i>=0; i--) {
      const d = debris[i];
      const dx = d.x - player.x, dy = d.y - player.y;
if (dx*dx + dy*dy < (d.r+player.r)*(d.r+player.r)) {
          score++; player.fuel = Math.min(100, player.fuel+2); // small fuel boost
          debris.splice(i,1);
          playCollect();
        } else if (d.y > height) debris.splice(i,1);
    }
    for (let i = asteroids.length-1; i>=0; i--) {
      const a = asteroids[i];
      const dx = a.x - player.x, dy = a.y - player.y;
if (dx*dx + dy*dy < (a.r+player.r)*(a.r+player.r)) {
          player.alive = false;
          playExplosion();
          break;
        } else if (a.y > height) asteroids.splice(i,1);
    }

    // spawning
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawn();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    ctx.clearRect(0,0,width,height);
    // background gradient and starfield
    const bgGrad = ctx.createLinearGradient(0,0,0,height);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // draw stars
    ctx.fillStyle = '#555';
    stars.forEach(s=>{ctx.fillRect(s.x,s.y,s.size,s.size);});
    // player ship – draw a triangle pointing up
    ctx.fillStyle = player.alive ? '#0f0' : '#f00';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.lineTo(player.x + player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();
    // optional thrust if moving via keys
    if (keys.ArrowUp || keys[' ']) {
      ctx.fillStyle = '#ff8';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y + player.r);
      ctx.lineTo(player.x - player.r/2, player.y + player.r + 8);
      ctx.lineTo(player.x + player.r/2, player.y + player.r + 8);
      ctx.closePath();
      ctx.fill();
    }
    // debris
    ctx.fillStyle = '#ff0';
    debris.forEach(d=>{ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();});
    // asteroids – draw irregular polygons
    ctx.fillStyle = '#777';
    asteroids.forEach(a=>{drawAsteroid(a);});
    function drawAsteroid(a){
      const points = 8;
      const angleStep = Math.PI*2/points;
      ctx.beginPath();
      for(let i=0;i<points;i++){
        const angle = i*angleStep;
        const radius = a.r * (0.6 + Math.random()*0.4);
        const x = a.x + Math.cos(angle)*radius;
        const y = a.y + Math.sin(angle)*radius;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fill();
    }
    // UI - score & fuel
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    ctx.fillText('Fuel: '+Math.max(0,Math.floor(player.fuel)), 10, 40);
    // fuel bar
    ctx.fillStyle = '#0af';
    ctx.fillRect(80,30, player.fuel, 8);
    if (!player.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width/2, height/2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Final Score: '+score, width/2, height/2+30);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
