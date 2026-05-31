// Cosmic Collector – concise canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
   // Create static starfield background
   const stars = Array.from({length: 100}, () => ({
     x: Math.random() * width,
     y: Math.random() * height,
     r: Math.random() * 1.5 + 0.5
   }));
   // Sound assets (place .mp3 files next to HTML)
   const collectSound = new Audio('collect.mp3');
   const hitSound = new Audio('hit.mp3');
   const bgMusic = new Audio('bgm.mp3');
   bgMusic.loop = true;
   bgMusic.volume = 0.3;
   bgMusic.play();

  // ----- Player -----
  const player = {
    x: width / 2,
    y: height / 2,
    r: 10,
    speed: 2,
    fuel: 100,
    vx: 0,
    vy: 0,
  };

  // ----- Game state -----
  let score = 0;
  const debris = [];
  const asteroids = [];
  let running = true;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function updatePlayer() {
    player.vx = (keys.ArrowLeft || keys.a) ? -player.speed : (keys.ArrowRight || keys.d) ? player.speed : 0;
    player.vy = (keys.ArrowUp || keys.w) ? -player.speed : (keys.ArrowDown || keys.s) ? player.speed : 0;
    player.x = Math.max(player.r, Math.min(width - player.r, player.x + player.vx));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y + player.vy));
    player.fuel = Math.max(0, player.fuel - 0.02);
  }

  function spawnDebris() {
    const size = 4 + Math.random() * 4;
    debris.push({ x: Math.random() * width, y: Math.random() * height, r: size });
  }

  function spawnAsteroid() {
    const side = Math.random() < 0.5 ? 'x' : 'y';
    const obj = {
      r: 15 + Math.random() * 15,
      speed: 0.5 + Math.random() * 1.0,
    };
    if (side === 'x') {
      obj.x = Math.random() * width;
      obj.y = Math.random() < 0.5 ? -obj.r : height + obj.r;
      obj.vx = 0;
      obj.vy = obj.y < 0 ? obj.speed : -obj.speed;
    } else {
      obj.y = Math.random() * height;
      obj.x = Math.random() < 0.5 ? -obj.r : width + obj.r;
      obj.vy = 0;
      obj.vx = obj.x < 0 ? obj.speed : -obj.speed;
    }
    asteroids.push(obj);
  }

  function updateObjects(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const o = arr[i];
      o.x += o.vx || 0;
      o.y += o.vy || 0;
      // Wrap around edges
      if (o.x < -o.r) o.x = width + o.r;
      if (o.x > width + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = height + o.r;
      if (o.y > height + o.r) o.y = -o.r;
    }
  }

  function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function checkCollisions() {
    // Debris collection
    for (let i = debris.length - 1; i >= 0; i--) {
      if (dist(player, debris[i]) < player.r + debris[i].r) {
        debris.splice(i, 1);
        score++;
        // play collection sound
        collectSound.currentTime = 0;
        collectSound.play();
        // occasional fuel boost
        if (Math.random() < 0.2) player.fuel = Math.min(100, player.fuel + 20);
      }
    }
    // Asteroid hit
    for (const a of asteroids) {
      if (dist(player, a) < player.r + a.r) {
        running = false;
        // play hit sound
        hitSound.currentTime = 0;
        hitSound.play();
        break;
      }
    }
    // Fuel out
    if (player.fuel <= 0) {
      running = false;
      // play hit sound (out of fuel)
      hitSound.currentTime = 0;
      hitSound.play();
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000020'; // deep space color
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = 'white';
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
    // Ship (triangle with stroke)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.beginPath();
    ctx.moveTo(0, -player.r);
    ctx.lineTo(player.r, player.r);
    ctx.lineTo(-player.r, player.r);
    ctx.closePath();
    ctx.fillStyle = 'cyan';
    ctx.fill();
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    // Debris
    ctx.fillStyle = 'yellow';
    debris.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); });
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 15);
    ctx.fillText(`Fuel: ${Math.floor(player.fuel)}`, 10, 30);
    if (!running) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop() {
    if (!running) { draw(); return; }
    updatePlayer();
    updateObjects(debris);
    updateObjects(asteroids);
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  // Spawn intervals
  setInterval(spawnDebris, 800);
  setInterval(spawnAsteroid, 2000);

  // Start
  requestAnimationFrame(loop);
})();
