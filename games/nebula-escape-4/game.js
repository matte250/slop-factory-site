// Nebula Escape – enhanced graphics
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // size canvas to fill parent
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5,
    });
  }

  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playFuelSound() { playTone(800, 0.07, 'triangle'); }
  function playCrashSound() { playTone(200, 0.3, 'square'); }
  function playThrustSound() { playTone(400, 0.05, 'sawtooth'); }

  const ship = {x: 80, y: canvas.height/2, w: 20, h: 12, speed: 3};
  let fuel = 100; // percent
  const asteroids = [];
  const fuels = [];
  let gameOver = false;
  let frame = 0;

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) playThrustSound();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const radius = 15 + Math.random()*15;
    asteroids.push({x: canvas.width + radius, y: Math.random()*canvas.height, r: radius, speed: 2 + Math.random()*3});
  }
  function spawnFuel() {
    const size = 10;
    fuels.push({x: canvas.width + size, y: Math.random()*canvas.height, s: size, speed: 2});
  }

  function update() {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));

    // background stars move left for parallax effect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }

    // spawn asteroids/fuel periodically
    if (frame % 60 === 0) spawnAsteroid();
    if (frame % 180 === 0) spawnFuel();

    // move asteroids
    for (let i = asteroids.length-1; i >=0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // collision with ship (circle-rect)
      const dx = Math.max(ship.x - a.r, Math.min(a.x, ship.x + ship.w));
      const dy = Math.max(ship.y - a.r, Math.min(a.y, ship.y + ship.h));
      if ((dx - a.x)**2 + (dy - a.y)**2 < a.r*a.r) {
        playCrashSound();
        gameOver = true;
      }
      if (a.x + a.r < 0) asteroids.splice(i,1);
    }
    // move fuel cells
    for (let i = fuels.length-1; i >=0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      // rect-rect collision
      if (f.x < ship.x + ship.w && f.x + f.s > ship.x && f.y < ship.y + ship.h && f.y + f.s > ship.y) {
        fuel = Math.min(100, fuel + 20);
        playFuelSound();
        fuels.splice(i,1);
      } else if (f.x + f.s < 0) {
        fuels.splice(i,1);
      }
    }
    // fuel consumption
    fuel -= 0.02;
    if (fuel <= 0) gameOver = true;
    frame++;
  }

  function draw() {
    // background gradient (deep space)
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,'#001020');
    grad.addColorStop(1,'#000030');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // stars (twinkling)
    ctx.fillStyle = 'white';
    stars.forEach(s=>{ctx.fillRect(s.x,s.y,s.size,s.size);});
    // ship (triangle with glow)
    ctx.save();
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w, ship.y + ship.h/2);
    ctx.lineTo(ship.x - ship.w, ship.y - ship.h/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with radial gradient
    asteroids.forEach(a=>{
      const g = ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,a.r);
      g.addColorStop(0,'#777');
      g.addColorStop(1,'#222');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,2*Math.PI);
      ctx.fill();
    });
    // fuel cells (glow)
    fuels.forEach(f=>{
      ctx.save();
      ctx.shadowColor = 'orange';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'yellow';
      ctx.fillRect(f.x,f.y,f.s,f.s);
      ctx.restore();
    });
    // HUD
    ctx.fillStyle = 'lime';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: '+Math.max(0,Math.floor(fuel))+'%',10,20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width/2-120, canvas.height/2);
    }
  }

  function loop(){
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
