// Simple Asteroid Dodge game for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const w = canvas.width = canvas.offsetWidth || 400;
  const h = canvas.height = canvas.offsetHeight || 600;

  // --- Player ---
  const ship = {x: w/2, y: h-60, w: 30, h: 30, speed: 3, fuel: 100};
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // --- Entities ---
  const asteroids = [];
  const fuels = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnAsteroid = () => {
    const size = rand(15, 40);
    asteroids.push({x: rand(0, w - size), y: -size, w: size, h: size, speed: rand(1, 4)});
  };
  const spawnFuel = () => {
    const size = 20;
    fuels.push({x: rand(0, w - size), y: -size, w: size, h: size, speed: 2});
  };

  const rectCollision = (a,b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    if (gameOver) return;
    // controls (arrow keys or WASD)
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // clamp
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(h - ship.h, ship.y));

    // fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) gameOver = true;

    // spawn entities
    if (frames % 60 === 0) spawnAsteroid();
    if (frames % 300 === 0) spawnFuel();

    // move asteroids
    asteroids.forEach((a,i)=>{
      a.y += a.speed;
      if (a.y > h) asteroids.splice(i,1);
        if (rectCollision(ship,a)) { playTone(200, 0.2); gameOver = true; }
    });
    // move fuels
    fuels.forEach((f,i)=>{
      f.y += f.speed;
      if (f.y > h) fuels.splice(i,1);
        if (rectCollision(ship,f)) { playTone(600, 0.1); ship.fuel = Math.min(100, ship.fuel + 30); fuels.splice(i,1); }
    });

    score = Math.floor(frames/60);
    frames++;
  };

  const render = () => {
    ctx.clearRect(0,0,w,h);
    // starfield background (moving stars)
    // create a simple star array that persists
    if (!window.stars) {
      window.stars = [];
      for (let i = 0; i < 100; i++) {
        window.stars.push({x: rand(0, w), y: rand(0, h), r: Math.random()*1.5 + 0.5, speed: Math.random()*0.5 + 0.2});
      }
    }
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,w,h);
    window.stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      s.y += s.speed;
      if (s.y > h) { s.y = 0; s.x = rand(0, w); }
    });
    // ship
    ctx.fillStyle = '#0f0';
    ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
    // asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a=>ctx.fillRect(a.x,a.y,a.w,a.h));
    // fuel cells
    ctx.fillStyle = '#ff0';
    fuels.forEach(f=>ctx.fillRect(f.x,f.y,f.w,f.h));
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10,20);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10,40);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', w/2-80, h/2);
    }
  };

  const loop = () => {
    update();
    render();
    if(!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
