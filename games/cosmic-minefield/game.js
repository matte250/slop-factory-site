// Simple Cosmic Minefield game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Starfield background
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({
      x: Math.random()*width,
      y: Math.random()*height,
      radius: Math.random()*1.5+0.5,
      speed: Math.random()*0.4+0.2
    });
  }

  // Ship
  const ship = {
    x: width / 2,
    y: height - 60,
    angle: -Math.PI / 2,
    speed: 0,
    velX: 0,
    velY: 0,
    size: 12,
    health: 3,
  };

  // Input handling
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function startAudio(){ if(!audioStarted){ audioCtx.resume(); audioStarted = true; } }
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  const sounds = {
    boost: () => playTone(400, 100),
    hit: () => playTone(100, 200),
    collect: () => playTone(800, 80),
    gameOver: () => playTone(50, 600),
  };
  window.addEventListener('keydown', e => { keys[e.key] = true; startAudio(); if(e.key === ' ') sounds.boost(); });
  window.addEventListener('keyup', e => keys[e.key] = false);

  const asteroids = [];
  const ores = [];
  let score = 0;

  function spawnAsteroid() {
    const r = Math.random() * 30 + 15;
    const x = Math.random() * (width - 2 * r) + r;
    const y = -r;
    const speed = Math.random() * 1.5 + 0.5;
    const sides = Math.floor(Math.random() * 5) + 5;
    const angle = Math.random() * Math.PI * 2;
    asteroids.push({x, y, r, speed, sides, angle});
  }

  function spawnOre() {
    const r = 8;
    const x = Math.random() * (width - 2 * r) + r;
    const y = -r;
    const speed = 1.2;
    ores.push({x, y, r, speed, pulse:0});
  }

  function update(dt) {
    // Controls
    const turnSpeed = 0.003 * dt;
    const thrust = 0.0015 * dt;
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= turnSpeed;
    if (keys['ArrowRight'] || keys['d']) ship.angle += turnSpeed;
    if (keys['ArrowUp'] || keys['w']) {
      ship.velX += Math.cos(ship.angle) * thrust;
      ship.velY += Math.sin(ship.angle) * thrust;
    }
    if (keys[' ']) { // boost
      ship.velX *= 1.02;
      ship.velY *= 1.02;
    }

    // Move ship
    ship.x += ship.velX * dt;
    ship.y += ship.velY * dt;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt;
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // Update ores
    for (let i = ores.length - 1; i >= 0; i--) {
      const o = ores[i];
      o.y += o.speed * dt;
      o.pulse = Math.sin(Date.now() / 200) * 2;
      if (o.y - o.r > height) ores.splice(i, 1);
    }

    // Collision detection
    function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
    // ship vs asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (dist(ship.x, ship.y, a.x, a.y) < a.r + ship.size) {
        ship.health--;
        sounds.hit();
        asteroids.splice(i, 1);
        if (ship.health <= 0) {
          sounds.gameOver();
          alert('Game Over! Score: ' + score);
          document.location.reload();
          return;
        }
      }
    }
    // ship vs ores
    for (let i = ores.length - 1; i >= 0; i--) {
      const o = ores[i];
      if (dist(ship.x, ship.y, o.x, o.y) < o.r + ship.size) {
        score += 10;
        sounds.collect();
        ores.splice(i, 1);
      }
    }

    // Random spawns
    if (Math.random() < 0.008) spawnAsteroid();
    if (Math.random() < 0.002) spawnOre();
  }

  function draw() {
    ctx.clearRect(0,0,width,height);
    // Starfield
    ctx.fillStyle='white';
    stars.forEach(s=>{
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
      // move star
      s.y += s.speed;
      if(s.y > height) { s.y = 0; s.x = Math.random()*width; }
    });
    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.size,0);
    ctx.lineTo(-ship.size/2, ship.size/2);
    ctx.lineTo(-ship.size/2, -ship.size/2);
    ctx.closePath();
    ctx.fillStyle='white';
    ctx.fill();
    ctx.restore();
    // Asteroids
    ctx.strokeStyle='gray';
    asteroids.forEach(a=>{
      ctx.save();
      ctx.translate(a.x,a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      for(let i=0;i<a.sides;i++){
        const theta = (i/a.sides)*Math.PI*2;
        const rad = a.r + Math.random()*a.r*0.3;
        ctx.lineTo(Math.cos(theta)*rad, Math.sin(theta)*rad);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
    // Ores
    ores.forEach(o=>{
      const alpha = 0.6 + 0.4*Math.sin(Date.now()/150);
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r+o.pulse,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,255,255,${alpha})`;
      ctx.fill();
    });
    // UI
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    ctx.fillText('Health: '+ship.health,10,40);
  }

  let last = performance.now();
  function loop(now){
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
