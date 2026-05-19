// Simple Meteor Dodge game
// Canvas with id="game"
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollisionSound(){ playTone(150, 0.2); }
  function playSpawnSound(){ playTone(300, 0.05); }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = {
    w: 40,
    h: 20,
    x: width/2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
    dy: 0
  };

  // Meteors array
  const meteors = [];
  const meteorSpawnInterval = 800; // ms
  let lastSpawn = 0;
  let startTime = null;
  let animationId = null;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e=>{keys[e.key]=true;});
  window.addEventListener('keyup', e=>{keys[e.key]=false;});
  // Resume audio context on first interaction
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });

  // Stars for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  function update(dt){
    // Ship movement
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // Spawn meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      const size = Math.random()*30 + 20;
      meteors.push({
        x: Math.random()*(width - size),
        y: -size,
        w: size,
        h: size,
        speed: 2 + Math.random()*3
      });
      playSpawnSound();
      lastSpawn = performance.now();
    }

    // Update meteors
    for (let i = meteors.length-1; i>=0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (m.y > height) meteors.splice(i,1);
    }

    // Update stars for parallax effect
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Collision detection
    for (const m of meteors) {
      if (rectCollide(ship, m)) {
        playCollisionSound();
        gameOver = true;
        cancelAnimationFrame(animationId);
        break;
      }
    }
  }

  function rectCollide(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

function draw(){
    // Clear canvas
    ctx.clearRect(0,0,width,height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,height);
    bgGrad.addColorStop(0,'#001848');
    bgGrad.addColorStop(1,'#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // Stars (twinkling)
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random().toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    // Ship triangle
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Meteors with gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(
        m.x + m.w/2, m.y + m.h/2, m.w*0.1,
        m.x + m.w/2, m.y + m.h/2, m.w/2
      );
      grad.addColorStop(0,'#ff8c00');
      grad.addColorStop(1,'#8b0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w/2, m.y + m.h/2, m.w/2, 0, Math.PI*2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime)/1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#ff5555';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }


  function loop(timestamp){
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (animationId ? animationId.time : timestamp);
    update(dt);
    draw();
    if (!gameOver) {
      animationId = requestAnimationFrame(loop);
    }
  }

  // Start loop
  animationId = requestAnimationFrame(loop);
})();
