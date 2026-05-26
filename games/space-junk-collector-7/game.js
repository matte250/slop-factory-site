// Simple Space Junk Collector game with improved graphics
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // generate background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  // Game objects
  const ship = { x: width/2, y: height/2, size: 20, speed: 3 };
  const junk = [];
  const asteroids = [];
  let score = 0;
  let fuel = 30; // seconds
  let lastTime = 0;
  let gameOver = false;
  // sounds
  const collectSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/beatbox/audio/snare.wav');
  const crashSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/beatbox/audio/kick.wav');
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/beatbox/audio/hihat.wav');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;

  // helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const circleCollide = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.radius + b.radius;
  };

  // spawn junk and asteroids periodically
  const spawnJunk = () => {
    junk.push({ x: rand(0, width), y: rand(0, height), radius: 8, collected: false });
  };
  const spawnAsteroid = () => {
    const radius = rand(15, 30);
    const x = rand(0, width);
    const y = rand(0, height);
    const vx = rand(-1, 1);
    const vy = rand(-1, 1);
    asteroids.push({ x, y, radius, vx, vy });
  };

  // initial population
  for (let i = 0; i < 5; i++) spawnJunk();
  for (let i = 0; i < 3; i++) spawnAsteroid();

  // input handling
  const keys = {};
  let musicStarted = false;
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!musicStarted) { bgMusic.play().catch(()=>{}); musicStarted = true; }
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  const update = (dt) => {
    if (gameOver) return;
    // ship movement
    if (keys['ArrowLeft'])  ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp'])    ship.y -= ship.speed;
    if (keys['ArrowDown'])  ship.y += ship.speed;
    // keep inside bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx * 1.5; a.y += a.vy * 1.5;
      if (a.x < 0 || a.x > width) a.vx *= -1;
      if (a.y < 0 || a.y > height) a.vy *= -1;
    }

    // check collisions with junk
    for (const j of junk) {
        if (!j.collected && circleCollide({x: ship.x, y: ship.y, radius: ship.size/2}, j)) {
          j.collected = true;
          score++;
          // play collect sound
          collectSound.currentTime = 0;
          collectSound.play().catch(()=>{});
          // respawn after short delay
          setTimeout(() => { j.x = rand(0, width); j.y = rand(0, height); j.collected = false; }, 500);
        }
    }

    // check collisions with asteroids
    for (const a of asteroids) {
        if (circleCollide({x: ship.x, y: ship.y, radius: ship.size/2}, a)) {
          gameOver = true;
          // play crash sound
          crashSound.currentTime = 0;
          crashSound.play().catch(()=>{});
          break;
        }
    }

    // fuel timer
    fuel -= dt/1000;
    if (fuel <= 0) gameOver = true;
  };

  const draw = () => {
    ctx.clearRect(0,0,width,height);
    // background stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    }
    // ship - draw as triangle with gradient
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, 0, ship.x, ship.y, ship.size);
    shipGrad.addColorStop(0, '#ffdd55');
    shipGrad.addColorStop(1, '#ff5500');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size/2);
    ctx.lineTo(ship.x - ship.size/2, ship.y + ship.size/2);
    ctx.lineTo(ship.x + ship.size/2, ship.y + ship.size/2);
    ctx.closePath();
    ctx.fill();
    // junk
    for (const j of junk) if (!j.collected) {
      ctx.fillStyle = 'lime';
      ctx.beginPath();
      ctx.arc(j.x, j.y, j.radius, 0, Math.PI*2);
      ctx.fill();
    }
    // asteroids with subtle shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius*0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(1)}s`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px monospace';
      ctx.fillText('GAME OVER', width/2-100, height/2);
    }
  };

  const loop = (timestamp) => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
