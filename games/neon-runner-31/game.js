// Neon Runner – endless runner for <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  const player = {
    x: 50,
    y: height - 40,
    radius: 10,
    vy: 0,
    gravity: 0.6,
    jump: -12,
    onGround: true,
    color: '#0ff'
  };

  const obstacles = [];
  const spawnRate = 120; // frames
  let frame = 0;
  let over = false;

  const spawn = () => {
    const w = 20 + Math.random()*30;
    const h = 20 + Math.random()*40;
    const type = Math.random()<0.5 ? 'low' : 'high';
    const y = type==='low' ? height - h - 10 : height - h - 30;
    obstacles.push({x: width, y, w, h});
  };

  const update = () => {
    if (over) return;
    ctx.clearRect(0,0,width,height);
    // neon background
    const grad = ctx.createLinearGradient(0,0,0,height);
    grad.addColorStop(0,'#001');
    grad.addColorStop(1,'#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y >= height - 40) { player.y = height - 40; player.vy = 0; player.onGround = true; }
    // draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    // obstacles
    for (let i=obstacles.length-1; i>=0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      ctx.fillStyle = '#f0f';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // collision
      if (player.x+player.radius>o.x && player.x-player.radius<o.x+o.w &&
          player.y+player.radius>o.y && player.y-player.radius<o.y+o.h) {
        over = true;
      }
      if (o.x+o.w < 0) obstacles.splice(i,1);
    }
    // spawn
    if (frame % spawnRate === 0) spawn();
    frame++;
    if (over) {
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    } else {
      requestAnimationFrame(update);
    }
  };

  const jump = () => {
    if (player.onGround) { player.vy = player.jump; player.onGround = false; }
  };
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e=>{e.preventDefault();jump();}, {passive:false});

  update();
})();