// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(() => {
  // Create starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = 800; canvas.height = 600;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let musicStarted = false;

  // Play a tone of given frequency and duration (ms)
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }

  function playCollect() { playTone(800, 100); }
  function playCrash() { playTone(200, 300); }
  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    // Simple background melody loop
    const notes = [261.6, 329.6, 392.0, 523.3]; // C4, E4, G4, C5
    let index = 0;
    setInterval(() => {
      playTone(notes[index % notes.length], 200);
      index++;
    }, 400);
  }

  const ship = {x: canvas.width/2, y: canvas.height-50, w:20, h:30, speed:4};
  const keys = {};
  const asteroids = [];
  const fuels = [];
  let fuel = 100; // percent
  let gameOver = false;

  const spawnAsteroid = () => {
    const radius = 15 + Math.random()*15;
    asteroids.push({x: Math.random()*canvas.width, y: -radius, r: radius, v: 1+Math.random()*2});
  };
  const spawnFuel = () => {
    const size = 12;
    fuels.push({x: Math.random()*canvas.width, y: -size, s: size, v: 1.5});
  };

  const drawShip = () => {
    const grad = ctx.createLinearGradient(ship.x - ship.w/2, ship.y, ship.x + ship.w/2, ship.y + ship.h);
    grad.addColorStop(0, '#0a0');
    grad.addColorStop(1, '#050');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w/2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawAsteroids = () => {
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  const drawStars = () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    stars.forEach(s=>{
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
    });
  };

  const drawFuels = () => {
    fuels.forEach(f=>{
      const grad = ctx.createRadialGradient(f.x, f.y, f.s*0.2, f.x, f.y, f.s);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.s/2, 0, Math.PI*2);
      ctx.fill();
    });
  };

  const update = () => {
    // move ship
    if (keys['ArrowLeft'] && ship.x - ship.w/2 > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w/2 < canvas.width) ship.x += ship.speed;
    if (keys['ArrowUp'] && ship.y > 0) ship.y -= ship.speed;
    if (keys['ArrowDown'] && ship.y + ship.h < canvas.height) ship.y += ship.speed;

    // move asteroids
    asteroids.forEach(a=> a.y += a.v);
    // remove off‑screen
    for (let i=asteroids.length-1;i>=0;i--) if (asteroids[i].y - asteroids[i].r > canvas.height) asteroids.splice(i,1);

    // move fuels
    fuels.forEach(f=> f.y += f.v);
    for (let i=fuels.length-1;i>=0;i--) if (fuels[i].y - fuels[i].s > canvas.height) fuels.splice(i,1);

    // collisions
    const shipRect = {x: ship.x - ship.w/2, y: ship.y, w: ship.w, h: ship.h};
    const collides = (ax, ay, ar) => {
      // simple circle‑rect collision
      const cx = Math.max(shipRect.x, Math.min(ax, shipRect.x + shipRect.w));
      const cy = Math.max(shipRect.y, Math.min(ay, shipRect.y + shipRect.h));
      const dx = ax - cx, dy = ay - cy;
      return dx*dx + dy*dy < ar*ar;
    };
    for (let i=asteroids.length-1;i>=0;i--) {
      if (collides(asteroids[i].x, asteroids[i].y, asteroids[i].r)) {playCrash(); gameOver=true; break;}
    }
    for (let i=fuels.length-1;i>=0;i--) {
      const f=fuels[i];
      if (collides(f.x, f.y, f.s/2)) {playCollect(); fuel = Math.min(100, fuel+20); fuels.splice(i,1);}    }

    // fuel consumption
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;
  };

  const render = () => {
    // draw background starfield first
    drawStars();
    drawShip();
    drawAsteroids();
    drawFuels();
    // fuel bar
    ctx.fillStyle = '#0ff';
    ctx.fillRect(10,10, fuel*2, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10,10,200,10);
    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  };

  let frame = 0;
  const loop = () => {
    if (!gameOver) {
      if (frame % 120 === 0) spawnAsteroid();
      if (frame % 500 === 0) spawnFuel();
      update();
    }
    render();
    frame++;
    requestAnimationFrame(loop);
  };

  window.addEventListener('keydown', e=>{
    keys[e.key]=true;
    startMusic();
    // resume audio context if needed (user interaction)
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e=>keys[e.key]=false);

  loop();
})();
