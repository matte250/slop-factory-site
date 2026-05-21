// Simple Space Runner game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 400;

  // generate static stars for background
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5
  }));

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1, type = 'sine', volume = 0.2) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const sound = {
    thrust: () => playTone(300, 0.08, 'square', 0.3),
    fuel: () => playTone(800, 0.12, 'triangle', 0.25),
    crash: () => playTone(100, 0.4, 'sawtooth', 0.5)
  };
  let crashPlayed = false;

  // Game state
  let running = true;
  let frames = 0;
  const GRAVITY = 0.3;
  const THRUST = -6;
  const OBSTACLE_FREQ = 120; // frames
  const FUEL_FREQ = 300;
  const FUEL_DECREASE = 0.02;

  const rocket = {
    x: 80,
    y: h/2,
    w: 30,
    h: 20,
    vy: 0,
    fuel: 1.0,
  draw() {
    // triangular rocket ship body
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.h/2);
    ctx.lineTo(this.x + this.w, this.y);
    ctx.lineTo(this.x + this.w, this.y + this.h);
    ctx.closePath();
    ctx.fill();
    // flame when thrusting (vy negative)
    if (this.vy < 0) {
      ctx.fillStyle = '#f80';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h/2);
      ctx.lineTo(this.x - this.w * 0.4, this.y + this.h/2 - this.h * 0.3);
      ctx.lineTo(this.x - this.w * 0.4, this.y + this.h/2 + this.h * 0.3);
      ctx.closePath();
      ctx.fill();
    }
  },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      // keep inside canvas
      if (this.y + this.h > h) { this.y = h - this.h; this.vy = 0; }
      if (this.y < 0) { this.y = 0; this.vy = 0; }
      this.fuel = Math.max(0, this.fuel - FUEL_DECREASE);
    }
  };

  const obstacles = [];
  const fuels = [];

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: w, y: Math.random() * (h - size), w: size, h: size });
  }
  function spawnFuel() {
    const size = 15;
    fuels.push({ x: w, y: Math.random() * (h - size), w: size, h: size });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (!running) return;
    frames++;
    // spawn
    if (frames % OBSTACLE_FREQ === 0) spawnObstacle();
    if (frames % FUEL_FREQ === 0) spawnFuel();
    // move obstacles & fuels
    obstacles.forEach(o => o.x -= 4);
    fuels.forEach(f => f.x -= 4);
    // remove off-screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (fuels.length && fuels[0].x + fuels[0].w < 0) fuels.shift();
    // update rocket
    rocket.update();
    // collisions
    for (let o of obstacles) {
      if (rectCollide(rocket, o)) {
        running = false;
        if (!crashPlayed) { sound.crash(); crashPlayed = true; }
        break;
      }
    }
    for (let i = fuels.length-1; i >=0; i--) {
        if (rectCollide(rocket, fuels[i])) {
          rocket.fuel = Math.min(1, rocket.fuel + 0.3);
          fuels.splice(i,1);
          sound.fuel();
        }
    }
    if (rocket.fuel <= 0) running = false;
  }

  // draw functions
  function drawAsteroid(o) {
    const gradient = ctx.createRadialGradient(
      o.x + o.w/2, o.y + o.h/2, o.w*0.1,
      o.x + o.w/2, o.y + o.h/2, o.w/2
    );
    gradient.addColorStop(0, '#777');
    gradient.addColorStop(1, '#333');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(o.x + o.w/2, o.y + o.h/2, o.w/2, o.h/2, Math.random()*Math.PI, 0, Math.PI*2);
    ctx.fill();
  }

  function drawFuelCell(f) {
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(f.x + f.w/2, f.y + f.h/2, f.w/2, 0, Math.PI*2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0,0,w,h);
    // background gradient (space)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, '#000022');
    bgGradient.addColorStop(1, '#000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0,0,w,h);
    // background stars (static twinkling)
    ctx.save();
    stars.forEach(star => {
      // move stars slightly for parallax effect
      const x = (star.x + frames * 0.2) % w;
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // obstacles
    obstacles.forEach(drawAsteroid);
    // fuel cells
    fuels.forEach(drawFuelCell);
    // rocket
    rocket.draw();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${(rocket.fuel*100).toFixed(0)}%`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over - Click to Restart', w/2, h/2);
    }
  }

  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousedown',()=>{ audioCtx.resume(); if(running){ rocket.vy = THRUST; sound.thrust(); } else restart(); });
  canvas.addEventListener('touchstart', e=>{ e.preventDefault(); audioCtx.resume(); if(running){ rocket.vy = THRUST; sound.thrust(); } else restart(); }, {passive:false});

  function restart(){
    running = true;
    frames = 0;
    obstacles.length = 0;
    fuels.length = 0;
    rocket.y = h/2; rocket.vy = 0; rocket.fuel = 1.0;
  }

  loop();
})();
