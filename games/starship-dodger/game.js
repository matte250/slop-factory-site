// Simple Starship Dodger game
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur, volume=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playLaserSound() { playTone(600, 0.08, 0.2); }
  function playExplosionSound() { playTone(200, 0.2, 0.3); }
  function playGameOverSound() { playTone(100, 0.5, 0.4); }
  const W = canvas.width = 400;
  const H = canvas.height = 600;
  // ship
  const ship = {x: W/2, y: H-60, w: 30, h: 30, speed: 5};
  // state
  const asteroids = [];
  const lasers = [];
  const stars = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastLaser = 0;
  let gameOver = false;
  // input
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);
  function spawnAsteroid() {
    const size = Math.random()*30+20;
    asteroids.push({x: Math.random()*(W-size), y: -size, w:size, h:size, speed: 2+Math.random()*3});
  }
  function spawnLaser() {
    lasers.push({x: ship.x, y: ship.y, w:4, h:10, speed:7});
    playLaserSound();
  }
  function update(dt) {
    if (gameOver) return;
    // ship movement
    if (keys['ArrowLeft'] && ship.x>0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x+ship.w<W) ship.x += ship.speed;
    if (keys['Space'] && performance.now()-lastLaser>200) {spawnLaser(); lastLaser=performance.now();}
    // asteroids
    if (performance.now()-lastAsteroid>1000) {spawnAsteroid(); lastAsteroid=performance.now();}
    asteroids.forEach(a=>a.y+=a.speed);
    // stars: simple moving starfield
    stars.forEach(s=>s.y+=s.speed);
    // recycle stars
    for (let i=stars.length-1;i>=0;i--) {
      const s=stars[i];
      if (s.y>H) {stars.splice(i,1);}
    }
    // occasional star spawn
    if (stars.length<100 && Math.random()<0.05) {
      stars.push({x: Math.random()*W, y: -2, speed: 0.5 + Math.random()*1.5});
    }
    // lasers
    lasers.forEach(l=>l.y-=l.speed);
    // collision ship-asteroid
    for (let i=asteroids.length-1;i>=0;i--) {
      const a=asteroids[i];
      if (a.y>H) {asteroids.splice(i,1); score+=1; continue;}
      if (a.x<ship.x+ship.w && a.x+a.w>ship.x && a.y<ship.y+ship.h && a.y+a.h>ship.y) {gameOver=true; playGameOverSound();}
    }
    // laser-asteroid
    for (let i=lasers.length-1;i>=0;i--) {
      const l=lasers[i];
      let hit=false;
      for (let j=asteroids.length-1;j>=0;j--) {
        const a=asteroids[j];
        if (l.x< a.x+a.w && l.x+l.w> a.x && l.y< a.y+a.h && l.y+l.h> a.y) {
          asteroids.splice(j,1); hit=true; score+=5; playExplosionSound(); break;
        }
      }
      if (hit || l.y<0) lasers.splice(i,1);
    }
    // score by time
    score += dt/1000;
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    // starfield background with moving stars
    ctx.fillStyle='black'; ctx.fillRect(0,0,W,H);
    stars.forEach(s=>{
      ctx.fillStyle='white';
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    // ship as a triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y+ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#007777');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y+ship.h);
    ctx.lineTo(ship.x+ship.w/2, ship.y);
    ctx.lineTo(ship.x+ship.w, ship.y+ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids as circles with radial gradient
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x+a.w/2, a.y+a.h/2, a.w*0.2, a.x+a.w/2, a.y+a.h/2, a.w/2);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x+a.w/2, a.y+a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // lasers with glow
    ctx.fillStyle='red';
    ctx.shadowColor='red';
    ctx.shadowBlur=8;
    lasers.forEach(l=>ctx.fillRect(l.x, l.y, l.w, l.h));
    ctx.shadowBlur=0; // reset blur
    // score text
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score),10,20);
    if (gameOver) {ctx.fillStyle='yellow'; ctx.font='24px sans-serif'; ctx.fillText('Game Over',W/2-60,H/2);}
  }
  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now-last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
