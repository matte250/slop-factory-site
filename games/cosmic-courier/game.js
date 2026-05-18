// Simple Cosmic Courier game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // ----- Audio -----
  const beepData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
  const soundCollect = new Audio(beepData);
  const soundCrash = new Audio(beepData);
  const soundThrust = new Audio(beepData);
  let thrustPlaying = false;

  // ----- Game objects -----
  const player = {x: 100, y: H/2, w: 30, h: 20, speed: 3, fuel: 100};
  const asteroids = [];
  const crates = [];
  const keys = {};
  let score = 0;
  let gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const size = 20 + Math.random()*30;
    asteroids.push({x: W+size, y: Math.random()*H, w:size, h:size, speed:2+Math.random()*2});
  }
  function spawnCrate() {
    const size = 15;
    crates.push({x: W+size, y: Math.random()*H, w:size, h:size, speed:2});
  }
  let asteroidTimer = 0, crateTimer = 0;

  // ----- Helpers -----
  function rectsCollide(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }
  // star objects for scrolling background
  const stars = [];
  for(let i=0;i<150;i++){
    stars.push({x: Math.random()*W, y: Math.random()*H, speed: 0.5 + Math.random()*0.5});
  }
  function drawStarfield(){
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    stars.forEach(s=>{
      ctx.fillRect(s.x, s.y, 2, 2);
    });
  }
  function updateStars(dt){
    stars.forEach(s=>{
      s.x -= s.speed * dt * 0.05; // move left
      if(s.x < 0) { s.x = W; s.y = Math.random()*H; }
    });
  }

  // ----- Main loop -----
  function update(dt){
    if (gameOver) return;
    // fuel consumption
    player.fuel -= dt*0.02; // deplete over time
    if (player.fuel <= 0) gameOver = true;

    // movement
    if (keys['ArrowUp']||keys['w']) player.y -= player.speed;
    if (keys['ArrowDown']||keys['s']) player.y += player.speed;
    if (keys['ArrowLeft']||keys['a']) player.x -= player.speed;
    if (keys['ArrowRight']||keys['d']) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(W-player.w, player.x));
    player.y = Math.max(0, Math.min(H-player.h, player.y));
    // thrust sound handling
    const moving = keys['ArrowUp']||keys['w']||keys['ArrowDown']||keys['s']||keys['ArrowLeft']||keys['a']||keys['ArrowRight']||keys['d'];
    if (moving && !thrustPlaying) { soundThrust.loop = true; soundThrust.play(); thrustPlaying = true; }
    else if (!moving && thrustPlaying) { soundThrust.pause(); soundThrust.currentTime = 0; thrustPlaying = false; }

    // update background stars
    updateStars(dt);

    // spawn obstacles & crates
    asteroidTimer += dt; crateTimer += dt;
    if (asteroidTimer > 1000) { spawnAsteroid(); asteroidTimer = 0; }
    if (crateTimer > 2000) { spawnCrate(); crateTimer = 0; }

    // move asteroids
    for (let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i,1);
      else if (rectsCollide(player,a)) { soundCrash.play(); gameOver = true; }
    }
    // move crates
    for (let i=crates.length-1;i>=0;i--){
      const c = crates[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) crates.splice(i,1);
      else if (rectsCollide(player,c)) {
        soundCollect.currentTime = 0; soundCollect.play();
        score += 10;
        player.fuel = Math.min(100, player.fuel + 20);
        crates.splice(i,1);
      }
    }
  }

  function draw(){
    drawStarfield();
    // player ship (gradient triangle with exhaust)
    // draw exhaust if moving
    if (keys['ArrowUp']||keys['w']||keys['ArrowDown']||keys['s']||keys['ArrowLeft']||keys['a']||keys['ArrowRight']||keys['d']){
      ctx.fillStyle = 'rgba(255,165,0,0.6)';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y + player.h/2);
      ctx.lineTo(player.x - 10, player.y + player.h/2 - 5);
      ctx.lineTo(player.x - 10, player.y + player.h/2 + 5);
      ctx.closePath();
      ctx.fill();
    }
    const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h/2);
    ctx.lineTo(player.x + player.w, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (draw as circles with gradient)
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.1, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // crates (draw as cubes)
    crates.forEach(c=>{
      ctx.fillStyle = '#ff0';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      // simple 3D effect
      ctx.strokeStyle = '#aa0';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w*0.2, c.y - c.h*0.2);
      ctx.lineTo(c.x + c.w + c.w*0.2, c.y - c.h*0.2);
      ctx.lineTo(c.x + c.w, c.y);
      ctx.closePath();
      ctx.stroke();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10,20);
    ctx.fillText('Fuel: '+Math.max(0,Math.floor(player.fuel)), 10,40);
    if (gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  let last = performance.now();
  function loop(){
    const now = performance.now();
    const dt = now - last; // ms
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
