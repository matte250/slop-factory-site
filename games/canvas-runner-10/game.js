// Simple endless runner for <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800);
  const H = (canvas.height = 400);

  // Player
  const player = {x: 50, y: H - 50, w: 30, h: 30, vy: 0, onGround: false};
  const GRAV = 0.6, JUMP = -12;

  // Game state
  let obstacles = [], stars = [], speed = 4, frame = 0, score = 0, over = false;

  const rand = (a,b)=>Math.random()*(b-a)+a;

  const spawnObstacle =()=>{
    const size = rand(20,40);
    obstacles.push({x:W, y:H-size, w:size, h:size});
  };
  const spawnStar =()=>{
    const size = 15;
    stars.push({x:W, y:rand(H-200, H-30), r:size/2});
  };

  const update =()=>{
    if (over) return;
    frame++;
    // Input handling (space or click)
    // Handled via event listeners outside loop

    // Player physics
    player.vy += GRAV;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }
    else player.onGround = false;

    // Spawn obstacles & stars
    if (frame % Math.max(60 - speed*2,20) === 0) spawnObstacle();
    if (frame % 120 === 0) spawnStar();

    // Move obstacles & stars
    obstacles.forEach(o=>o.x -= speed);
    stars.forEach(s=>s.x -= speed);
    // Remove off‑screen
    obstacles = obstacles.filter(o=>o.x+o.w>0);
    stars = stars.filter(s=>s.x+s.r>0);

    // Collision detection
    for (let o of obstacles) {
      if (player.x < o.x+o.w && player.x+player.w > o.x &&
          player.y < o.y+o.h && player.y+player.h > o.y) { over = true; playGameOver(); }
    }
    // Collect stars
    stars = stars.filter(s=>{
      const dx = (player.x+player.w/2) - s.x;
      const dy = (player.y+player.h/2) - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < s.r + Math.min(player.w,player.h)/2) { score += 10; playStar(); return false; }
      return true;
    });

    // Increase speed gradually
    speed += 0.0005;
    score += 0.1;
  };

  const draw =()=>{
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#1e90ff'); // deeper blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,H);
    // ground with darker stripe
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0,H-40,W,40);
    // player – rounded green block with subtle gradient
    const pGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y+player.h);
    pGrad.addColorStop(0, '#7CFC00');
    pGrad.addColorStop(1, '#228B22');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    const radius = 6;
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // obstacles – simple red spikes (triangles)
    ctx.fillStyle = '#e74c3c';
    obstacles.forEach(o=>{
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w/2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // stars – glowing yellow with radial gradient
    stars.forEach(s=>{
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,165,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score), 10, 20);
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W/2-80, H/2);
    }
  };

  const loop =()=>{ update(); draw(); if(!over) requestAnimationFrame(loop); };

  // Audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration, type='sine', volume=0.2)=>{
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJump = ()=>playTone(300, 0.1, 'square');
  const playStar = ()=>playTone(800, 0.05, 'triangle');
  const playGameOver = ()=>playTone(100, 0.5, 'sawtooth', 0.3);

  // Input listeners
  const jump =()=>{ if (player.onGround) { player.vy = JUMP; player.onGround = false; playJump(); } };
  window.addEventListener('keydown', e=>{ if (e.code==='Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // Start
  requestAnimationFrame(loop);
})();
