// Simple endless runner targeting <canvas id="game"></canvas>
// Enhanced graphics: gradient sky, ground gradient, rounded player, spike obstacles, basic particle effect
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playNoise(duration) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + duration);
  }

  // Player
  const player = {
    x: 50,
    y: H - 40,
    w: 30,
    h: 30,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    slide: false,
    slideTimer: 0,
  };

  // Obstacles and particles
  const obstacles = [];
  let particles = [];
  const obstacleTypes = [
    {w:20,h:40,offsetY:0}, // spike
    {w:30,h:30,offsetY:0, slideOnly:true} // low wall (requires slide)
  ];

  let frame=0, score=0, speed=3;

  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.code]=true;});
  window.addEventListener('keyup',e=>{keys[e.code]=false;});

  function spawnObstacle(){
    const type = obstacleTypes[Math.floor(Math.random()*obstacleTypes.length)];
    const obs = {
      x: W,
      y: H - type.h,
      w: type.w,
      h: type.h,
      slideOnly: type.slideOnly||false,
    };
    obstacles.push(obs);
  }

  function update(){
    frame++;
    // player controls
    if (keys['Space'] && player.y===H-40){
      // resume audio context on first interaction
      if (audioCtx.state !== 'running') audioCtx.resume();
      playTone(440, 0.1); // jump sound
      player.vy = player.jumpStrength;
    }
    if (keys['ArrowDown'] && player.y===H-40){
      // resume audio context if needed
      if (audioCtx.state !== 'running') audioCtx.resume();
      playTone(220, 0.08); // slide sound
      player.slide = true;
      player.slideTimer = 15; // frames
      player.h = 15;
      player.y = H - player.h;
    }
    // gravity
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > H - player.h){
      player.y = H - player.h;
      player.vy = 0;
    }
    // slide timer
    if (player.slide){
      player.slideTimer--;
      if (player.slideTimer<=0){
        player.slide = false;
        player.h = 30;
        player.y = H - player.h;
      }
    }
    // obstacles
    if (frame % 90 === 0) spawnObstacle();
    obstacles.forEach(o=> o.x -= speed);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // particles (dust) behind player
    if (frame % 5 === 0){
      particles.push({
        x: player.x + player.w/2,
        y: H - 10,
        alpha: 0.8,
        dy: -0.5 - Math.random()*0.5
      });
    }
    particles.forEach(p => {
      p.y += p.dy;
      p.alpha -= 0.02;
    });
    particles = particles.filter(p => p.alpha > 0);
    // collision
    for (const o of obstacles){
      const collides =
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y &&
        (!o.slideOnly || player.slide);
      if (collides){
        // play collision noise
        playNoise(0.3);
        // simple lose: stop animation
        cancelAnimationFrame(rAF);
        alert('Game Over! Score: '+Math.floor(score));
        return;
      }
    }
    // score & speed increase
    score += 0.1;
    if (frame % 600 === 0) speed += 0.5;
  }

  function roundedRect(ctx, x, y, width, height, radius){
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
let rAF;
  function draw(){
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#B0E0E6'); // pale
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,H);
    // ground gradient
    const grd = ctx.createLinearGradient(0,H-10,0,H);
    grd.addColorStop(0, '#654321');
    grd.addColorStop(1, '#453210');
    ctx.fillStyle = grd;
    ctx.fillRect(0,H-10,W,10);
    // particles
    ctx.fillStyle = '#fff';
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // player (rounded rectangle)
    ctx.fillStyle = '#0f0';
    roundedRect(ctx, player.x, player.y, player.w, player.h, 5);
    ctx.fill();
    // obstacles
    ctx.fillStyle = '#f00';
    for (const o of obstacles){
      if (o.slideOnly) {
        ctx.fillRect(o.x, o.y, o.w, o.h);
      } else {
        // spike triangle
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w/2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
    }
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score),10,20);
  }

  function loop(){
    update();
    draw();
    rAF = requestAnimationFrame(loop);
  }
  loop();
})();
