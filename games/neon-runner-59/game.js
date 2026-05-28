// Minimalist endless runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => beep(300, 0.1);
  const playCollectSound = () => beep(800, 0.08);
  const playGameOverSound = () => beep(150, 0.4);
  const W = canvas.width = 800;
  const H = canvas.height = 200;
  const GRAVITY = 0.6;
  const JUMP = -12;
  const PLAYER = {x:80, y:H-40, w:30, h:30, vy:0, onGround:true};
  let obstacles = [];
  let orbs = [];
  let score = 0;
  let gameOver = false;
  // spawn timers (frames)
  let obsTimer = 0, orbTimer = 0;
  // background stars for visual effect
  const STAR_COUNT = 80;
  const stars = Array.from({length: STAR_COUNT},()=>({
    x: Math.random()*W,
    y: Math.random()*H,
    r: Math.random()*1.5+0.5,
    opacity: Math.random()*0.5+0.3
  }));
  const spawnObstacle = () => {
    const size = 30 + Math.random()*20;
    obstacles.push({x:W, y:H-size, w:size, h:size});
  };
  const spawnOrb = () => {
    const r = 8 + Math.random()*6;
    orbs.push({x:W, y:H-40-Math.random()*80, r});
  };
  const rectCollision = (a,b)=> a.x<a.x+b.w && a.x+a.w>b.x && a.y<a.y+b.h && a.y+a.h>b.y;
  const circleCollision = (player, orb) => {
    const cx = orb.x + orb.r;
    const cy = orb.y + orb.r;
    const nearestX = Math.max(player.x, Math.min(cx, player.x+player.w));
    const nearestY = Math.max(player.y, Math.min(cy, player.y+player.h));
    const dx = cx - nearestX, dy = cy - nearestY;
    return dx*dx + dy*dy < orb.r*orb.r;
  };
  const update = () => {
    if (gameOver) return;
    // player physics
    PLAYER.vy += GRAVITY;
    PLAYER.y += PLAYER.vy;
    if (PLAYER.y + PLAYER.h >= H) { PLAYER.y = H-PLAYER.h; PLAYER.vy=0; PLAYER.onGround=true; }
    else PLAYER.onGround=false;
    // move obstacles
    obstacles.forEach(o=> o.x -= 5);
    obstacles = obstacles.filter(o=> o.x+o.w>0);
    // move orbs
    orbs.forEach(o=> o.x -= 5);
    orbs = orbs.filter(o=> o.x+o.r*2>0);
    // move stars (parallax)
    stars.forEach(s=> {
      s.x -= 0.5;
      if (s.x < 0) { s.x = W; s.y = Math.random()*H; }
    });
    // collisions
    for (let i=obstacles.length-1;i>=0;i--) {
      if (rectCollision(PLAYER, obstacles[i])) { gameOver = true; playGameOverSound(); break; }
    }
    for (let i=orbs.length-1;i>=0;i--) {
      if (circleCollision(PLAYER, orbs[i])) { score++; playCollectSound(); orbs.splice(i,1); }
    }
    // spawn
    if (++obsTimer > 80) { spawnObstacle(); obsTimer=0; }
    if (++orbTimer > 150) { spawnOrb(); orbTimer=0; }
  };
const draw = () => {
    // clear frame
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.stroke();
    // draw stars (parallax)
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player (glow circle)
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(PLAYER.x + PLAYER.w / 2, PLAYER.y + PLAYER.h / 2, PLAYER.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // obstacles with gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#f55');
      grad.addColorStop(1, '#900');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // orbs with radial glow
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.r, o.y + o.r, 0, o.x + o.r, o.y + o.r, o.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.r, o.y + o.r, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };
  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  // input
  canvas.addEventListener('click',()=>{
    // Ensure audio context is resumed on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (PLAYER.onGround) {
      PLAYER.vy = JUMP;
      playJumpSound();
    }
  });
  document.addEventListener('keydown', e=>{
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if ((e.key===' '||e.key==='ArrowUp') && PLAYER.onGround) {
      PLAYER.vy = JUMP;
      playJumpSound();
    }
  });
  // start
  requestAnimationFrame(loop);
})();
