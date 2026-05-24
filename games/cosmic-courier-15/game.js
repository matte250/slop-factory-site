// Simple Cosmic Courier game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // ----- audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  // ----- utilities -----
  const rect = (o) => ({x: o.x, y: o.y, w: o.w, h: o.h});
  const coll = (a, b) => !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);

  // ----- game objects -----
  const ship = {x: W/2-15, y: H-60, w: 30, h: 30, speed: 200, carrying: false};
  const packages = [];
  const stations = [];
  const asteroids = [];
  const stars = [];
  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  // ----- input -----
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // ----- spawn helpers -----
  const spawnPackage = () => {
    packages.push({x: Math.random()* (W-20), y: H-20, w: 20, h: 20});
  };
  const spawnStation = () => {
    stations.push({x: Math.random()* (W-60), y: 10, w: 60, h: 30, dir: Math.random()<0.5?1:-1, speed: 50});
  };
  const spawnAsteroid = () => {
    const size = 20 + Math.random()*30;
    asteroids.push({x: Math.random()* (W-size), y: -size, w: size, h: size, speed: 80 + Math.random()*70});
  };
  const spawnStar = () => {
    stars.push({x: Math.random()*W, y: Math.random()*H, r: Math.random()*2, speed: 30+Math.random()*70});
  };

  // initial spawns
  for(let i=0;i<50;i++) spawnStar();
  spawnPackage();
  spawnStation();
  setInterval(spawnPackage, 5000);
  setInterval(spawnStation, 8000);
  setInterval(spawnAsteroid, 1500);

  // ----- game loop -----
  const update = (dt) => {
    if (gameOver) return;
    // ship movement
    const s = ship.speed * dt;
    if (keys['ArrowLeft']||keys['a']) ship.x -= s;
    if (keys['ArrowRight']||keys['d']) ship.x += s;
    if (keys['ArrowUp']||keys['w']) ship.y -= s;
    if (keys['ArrowDown']||keys['s']) ship.y += s;
    ship.x = Math.max(0, Math.min(W-ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H-ship.h, ship.y));

    // starfield
    stars.forEach(st => {st.y += st.speed*dt; if(st.y>H){st.y=0; st.x=Math.random()*W;}});

    // stations move horizontally
    stations.forEach(st => {st.x += st.dir*st.speed*dt; if(st.x<0||st.x>W-st.w) st.dir*=-1;});

    // asteroids fall
    asteroids.forEach(ax => ax.y += ax.speed*dt);
    // remove off‑screen asteroids
    while (asteroids.length && asteroids[0].y>H) asteroids.shift();

    // collision: ship with package
    packages.forEach((p,i)=>{
      if(!ship.carrying && coll(rect(ship),rect(p))){
        ship.carrying=true;
        packages.splice(i,1);
        playTone(440); // pickup sound
      }
    });
    // ship with station to deliver
    stations.forEach(st=>{
      if(ship.carrying && coll(rect(ship),rect(st))){
        ship.carrying=false;
        score+=10;
        ship.speed+=10;
        spawnPackage();
        playTone(660); // delivery sound
      }
    });
    // ship with asteroid -> game over
    if (asteroids.some(ax=>coll(rect(ship),rect(ax)))){
      playTone(200,0.4); // collision sound
      gameOver = true;
    }
  };

  const draw = () => {
    // background gradient
    const bg = ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);
    // stars with glow
    stars.forEach(st=>{
      ctx.beginPath();
      ctx.arc(st.x,st.y,st.r+1,0,2*Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(st.x,st.y,st.r,0,2*Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });
    // ship as triangle
    ctx.fillStyle = ship.carrying ? '#0f0' : '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // packages as crates with border
    packages.forEach(p=>{
      ctx.fillStyle = '#ff0';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#aa0';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });
    // stations as circles with outer glow
    stations.forEach(st=>{
      const grad = ctx.createRadialGradient(st.x+st.w/2, st.y+st.h/2, st.w/4, st.x+st.w/2, st.y+st.h/2, st.w/2);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#600060');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(st.x+st.w/2, st.y+st.h/2, st.w/2, 0, 2*Math.PI);
      ctx.fill();
    });
    // asteroids as circles with shading
    asteroids.forEach(ax=>{
      ctx.beginPath();
      ctx.arc(ax.x+ax.w/2, ax.y+ax.h/2, ax.w/2, 0, 2*Math.PI);
      ctx.fillStyle = '#555';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    if(gameOver){ctx.fillStyle='red';ctx.font='48px sans-serif';ctx.fillText('GAME OVER',W/2-150,H/2);}
  };

  const loop = (time) => {
    const dt = (time - lastTime)/1000; lastTime = time;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
