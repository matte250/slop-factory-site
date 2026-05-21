// Starship Drift – improved graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;

  // Ship – always near center, drifts forward
  const ship = {
    x: w / 2,
    y: h / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.07,
  };

  const keys = {};
  // Set up simple sound effects using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust(){ playTone(600, 0.05); }
  function playExplosion(){ playTone(150, 0.3); }
  window.addEventListener('keydown', e => { keys[e.code] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    let x, y, dx, dy;
    const size = 20 + Math.random() * 30;
    const speed = 1 + Math.random() * 1.5;
    switch (side) {
      case 0: // top
        x = Math.random() * w; y = -size; dx = (ship.x - x) / w * speed; dy = speed; break;
      case 1: // right
        x = w + size; y = Math.random() * h; dx = -speed; dy = (ship.y - y) / h * speed; break;
      case 2: // bottom
        x = Math.random() * w; y = h + size; dx = (ship.x - x) / w * speed; dy = -speed; break;
      case 3: // left
        x = -size; y = Math.random() * h; dx = speed; dy = (ship.y - y) / h * speed; break;
    }
    asteroids.push({ x, y, dx, dy, r: size });
  }

  function update(dt) {
    if (gameOver) return;
    // input
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp'] || keys['KeyW']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      playThrust();
    }
    // drift forward constantly
    ship.vx += Math.cos(ship.angle) * 0.02;
    ship.vy += Math.sin(ship.angle) * 0.02;

    ship.x += ship.vx;
    ship.y += ship.vy;

    // wrap ship around edges
    if (ship.x < 0) ship.x += w;
    if (ship.x > w) ship.x -= w;
    if (ship.y < 0) ship.y += h;
    if (ship.y > h) ship.y -= h;

    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.dx;
      a.y += a.dy;
      // remove off‑screen
      if (a.x < -a.r || a.x > w + a.r || a.y < -a.r || a.y > h + a.r) {
        asteroids.splice(i, 1);
      } else if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.r + ship.r) {
        gameOver = true;
      }
    }

    // spawn
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // score = seconds survived
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  function drawBackground(){
    // small distant stars
    ctx.fillStyle = '#111';
    for(let i=0;i<30;i++){
      const sx = Math.random()*w;
      const sy = Math.random()*h;
      ctx.fillRect(sx,sy,1,1);
    }
  }

function drawShip(){
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body gradient
    const grad = ctx.createLinearGradient(-ship.r,0,ship.r,0);
    grad.addColorStop(0,'#0f0');
    grad.addColorStop(1,'#0a0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.r,0);
    ctx.lineTo(-ship.r, ship.r/2);
    ctx.lineTo(-ship.r, -ship.r/2);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if(keys['ArrowUp']||keys['KeyW']){
      ctx.fillStyle='orange';
      ctx.beginPath();
      ctx.moveTo(-ship.r,0);
      ctx.lineTo(-ship.r-8,2);
      ctx.lineTo(-ship.r-8,-2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

function drawAsteroid(a){
    ctx.save();
    ctx.translate(a.x,a.y);
    const grad = ctx.createRadialGradient(0,0,a.r*0.3,0,0,a.r);
    grad.addColorStop(0,'#777');
    grad.addColorStop(1,'#444');
    ctx.fillStyle = grad;
    // draw rough polygon
    ctx.beginPath();
    const points = 8 + Math.floor(Math.random()*4);
    for(let i=0;i<points;i++){
      const angle = (i/points)*Math.PI*2;
      const radius = a.r*(0.7+Math.random()*0.6);
      ctx.lineTo(Math.cos(angle)*radius, Math.sin(angle)*radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

function draw() {
    // clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // stars
    drawBackground();

    // ship with gradient and flame
    drawShip();

    // asteroids with gradient rough shape
    for (const a of asteroids) {
      drawAsteroid(a);
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
