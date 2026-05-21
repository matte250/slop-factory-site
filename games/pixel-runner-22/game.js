// Simple endless runner for canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800);
  const H = (canvas.height = 400);

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playJump = () => playTone(300, 0.1);
  const playCollect = () => playTone(600, 0.1);
  const playGameOver = () => playTone(150, 0.5);

  // player
  const player = {x: 50, y: H - 60, w: 30, h: 30, vy: 0, jumpStrength: -12, onGround: true};
  const GRAVITY = 0.6;

  // obstacles and stars
  const obstacles = [];
  const stars = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const size = 30 + Math.random()*20;
    obstacles.push({x: W, y: H - size, w: size, h: size});
  };
  const spawnStar = () => {
    const size = 20;
    const y = H - 80 - Math.random()*150;
    stars.push({x: W, y, w: size, h: size});
  };

  const rectCollide = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.onGround = true; }
    // move obstacles & stars
    obstacles.forEach(o => o.x -= 5);
    stars.forEach(s => s.x -= 5);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].w < 0) stars.shift();
    // collisions
    for (const o of obstacles) if (rectCollide(player,o)) { if (!gameOver) { playGameOver(); } gameOver = true; }
    for (let i=stars.length-1;i>=0;i--) if (rectCollide(player,stars[i])) { score++; playCollect(); stars.splice(i,1); }
    // spawn logic
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 150 === 0) spawnStar();
    frame++;
  };

  const draw = () => {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,"#87ceeb"); // sky blue
    bgGrad.addColorStop(1,"#e0f7fa"); // light cyan
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // simple hills (parallax)
    ctx.fillStyle = '#6b8e23';
    ctx.beginPath();
    ctx.arc(200, H-20, 120, Math.PI, 0);
    ctx.arc(600, H-20, 180, Math.PI, 0);
    ctx.fill();
    // ground strip
    ctx.fillStyle = '#444';
    ctx.fillRect(0,H-20,W,20);
    // helper for rounded rectangles
    const roundRect = (x,y,w,h,r,style)=>{ctx.fillStyle=style;ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();};
    // player (green rounded)
    roundRect(player.x,player.y,player.w,player.h,6,"#0f0");
    // obstacles (red rounded)
    obstacles.forEach(o=>roundRect(o.x,o.y,o.w,o.h,4,"#f00"));
    // stars (glowing circles)
    stars.forEach(s=>{const rad = s.w/2; const grad = ctx.createRadialGradient(s.x+rad,s.y+rad,rad*0.2,s.x+rad,s.y+rad,rad);grad.addColorStop(0,"#fff700");grad.addColorStop(1,"#ffb400");ctx.fillStyle=grad;ctx.beginPath();ctx.arc(s.x+rad,s.y+rad,rad,0,Math.PI*2);ctx.fill();});
    // score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: '+score,10,30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over',W/2,H/2);
    }
  };

  const loop = () => {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  };

  // controls
  const jump = () => { if (player.onGround) { player.vy = player.jumpStrength; player.onGround = false; playJump(); } };
  document.addEventListener('keydown', e=>{ if (e.code === 'Space') jump(); });
  document.addEventListener('touchstart', jump);

  loop();
})();
