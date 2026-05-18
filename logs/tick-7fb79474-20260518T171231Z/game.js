// Simple Nebula Escape game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio assets
  const sounds = {
    collect: new Audio('collect.wav'),
    crash: new Audio('crash.wav'),
    bg: new Audio('bg.mp3')
  };
  sounds.bg.loop = true;
  // start background after first user interaction
  let audioStarted = false;
  const startAudio = () => {
    if (!audioStarted) {
      sounds.bg.play().catch(()=>{});
      audioStarted = true;
    }
  };
  window.addEventListener('keydown', startAudio, { once: true });
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = { x: 50, y: canvas.height / 2, w: 30, h: 20, speed: 4 };
  let score = 0,
    fuel = 100,
    obstacles = [],
    orbs = [],
    stars = [],
    keys = {};

  const random = (min, max) => Math.random() * (max - min) + min;
  const collide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const spawnObstacle = () => {
    const size = random(20, 40);
    obstacles.push({ x: canvas.width, y: random(0, canvas.height - size), w: size, h: size, speed: random(2, 5) });
  };
  const spawnOrb = () => {
    const size = 15;
    orbs.push({ x: canvas.width, y: random(0, canvas.height - size), w: size, h: size, speed: 2 });
  };

  // initialize stars
  const initStars = () => {
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: random(0, canvas.width),
        y: random(0, canvas.height),
        speed: random(0.2, 0.6),
        alpha: random(0.5, 1)
      });
    }
  };
  initStars();

  const update = () => {
    // movement
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // obstacles
    obstacles.forEach(o => o.x -= o.speed);
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // orbs
    orbs.forEach(o => o.x -= o.speed);
    orbs = orbs.filter(o => o.x + o.w > 0);
    // stars (parallax background)
    stars.forEach(s => s.x -= s.speed);
    stars = stars.filter(s => s.x > 0);

    // collisions
    obstacles.forEach(o => {
      if (collide(ship, o)) {
        gameOver();
      }
    });
    orbs.forEach((o, i) => {
      if (collide(ship, o)) {
        score += 10;
        fuel = Math.min(100, fuel + 15);
        orbs.splice(i, 1);
        sounds.collect.currentTime = 0;
        sounds.collect.play().catch(()=>{});
      }
    });

    // fuel drain
    fuel -= 0.05;
    if (fuel <= 0) gameOver();
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient (nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // obstacles (asteroid circles with gradient)
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.w / 2, o.y + o.h / 2, o.w / 4, o.x + o.w / 2, o.y + o.h / 2, o.w / 2);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // orbs (glowing energy)
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15;
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}`, 10, 40);
  };

  let running = true;
  const gameOver = () => {
    running = false;
    // play crash sound
    sounds.crash.currentTime = 0;
    sounds.crash.play().catch(()=>{});
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 70, canvas.height / 2);
    ctx.font = '20px sans-serif';
    ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2 - 80, canvas.height / 2 + 30);
  };

  const loop = () => {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // spawn intervals
  setInterval(spawnObstacle, 1500);
  setInterval(spawnOrb, 2000);

  // start
  requestAnimationFrame(loop);
})();
