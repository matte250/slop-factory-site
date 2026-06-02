// Laser Maze Game
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 600;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // simple tone player
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now + duration);
  }
  // background hum (low freq loop)
  const humOsc = audioCtx.createOscillator();
  const humGain = audioCtx.createGain();
  humOsc.frequency.value = 30;
  humGain.gain.value = 0.02;
  humOsc.connect(humGain).connect(audioCtx.destination);
  humOsc.start();

  // ----- Game state -----
  const TILE = 40; // size of maze cells
  const rows = Math.floor(HEIGHT / TILE);
  const cols = Math.floor(WIDTH / TILE);

  // Simple random walls (border + some interior)
  const walls = [];
  // borders
  for (let x = 0; x < cols; x++) walls.push({x, y:0});
  for (let x = 0; x < cols; x++) walls.push({x, y:rows-1});
  for (let y = 0; y < rows; y++) walls.push({x:0, y});
  for (let y = 0; y < rows; y++) walls.push({x:cols-1, y});
  // random interior walls
  for (let i = 0; i < Math.floor(cols*rows*0.15); i++) {
    const x = 1 + Math.floor(Math.random()* (cols-2));
    const y = 1 + Math.floor(Math.random()* (rows-2));
    // avoid start (1,1) and exit (cols-2, rows-2)
    if ((x===1 && y===1) || (x===cols-2 && y===rows-2)) continue;
    walls.push({x,y});
  }

  // Ship
  const ship = {x: TILE/2, y: TILE/2, size: TILE*0.6, vx:0, vy:0, speed:0.2};

  // Lasers – each laser is a line moving back and forth
  const lasers = [];
  const laserCount = Math.max(3, Math.floor((cols+rows)/4));
  for (let i=0;i<laserCount;i++) {
    const vertical = Math.random()<0.5;
    const line = vertical ? {
      x1: (1+Math.floor(Math.random()*(cols-2)))*TILE,
      y1: TILE,
      x2: (1+Math.floor(Math.random()*(cols-2)))*TILE,
      y2: HEIGHT - TILE,
      dir: 1,
      speed: 1 + Math.random()*2,
      vertical:true
    } : {
      x1: TILE,
      y1: (1+Math.floor(Math.random()*(rows-2)))*TILE,
      x2: WIDTH - TILE,
      y2: (1+Math.floor(Math.random()*(rows-2)))*TILE,
      dir: 1,
      speed: 1 + Math.random()*2,
      vertical:false
    };
    lasers.push(line);
  }

  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (gameOver && e.key === ' ') restart();
  });
  window.addEventListener('keyup', e => {keys[e.key]=false});

  function update(dt) {
    if (gameOver) return;
    // ship movement (drift)
    if (keys['ArrowUp']) ship.vy -= ship.speed;
    if (keys['ArrowDown']) ship.vy += ship.speed;
    if (keys['ArrowLeft']) ship.vx -= ship.speed;
    if (keys['ArrowRight']) ship.vx += ship.speed;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // slowly damp velocity for drift effect
    ship.vx *= 0.95;
    ship.vy *= 0.95;

    // bounds check
    if (ship.x < 0) ship.x = 0;
    if (ship.y < 0) ship.y = 0;
    if (ship.x > WIDTH) ship.x = WIDTH;
    if (ship.y > HEIGHT) ship.y = HEIGHT;

    // lasers move
    lasers.forEach(l => {
      if (l.vertical) {
        l.x1 += l.dir * l.speed * dt;
        l.x2 += l.dir * l.speed * dt;
        if (l.x1 < TILE || l.x1 > WIDTH - TILE) l.dir *= -1;
      } else {
        l.y1 += l.dir * l.speed * dt;
        l.y2 += l.dir * l.speed * dt;
        if (l.y1 < TILE || l.y1 > HEIGHT - TILE) l.dir *= -1;
      }
    });

    // collision detection
    // walls (simple AABB)
    const shipRect = {x: ship.x-ship.size/2, y: ship.y-ship.size/2, w: ship.size, h: ship.size};
    for (const w of walls) {
      const wx = w.x * TILE, wy = w.y * TILE;
      if (rectIntersect(shipRect, {x:wx, y:wy, w:TILE, h:TILE})) {
          gameOver = true;
          playTone(200, 0.3); // wall collision
          break;
        }
    }
    // lasers (line vs circle approximation)
    if (!gameOver) {
      for (const l of lasers) {
        const dx = l.x2 - l.x1;
        const dy = l.y2 - l.y1;
        const len = Math.hypot(dx, dy);
        const nx = dx/len, ny = dy/len;
        // project ship centre onto line
        const px = ship.x - l.x1;
        const py = ship.y - l.y1;
        const proj = px*nx + py*ny;
        const closestX = l.x1 + Math.max(0, Math.min(len, proj)) * nx;
        const closestY = l.y1 + Math.max(0, Math.min(len, proj)) * ny;
        const dist = Math.hypot(ship.x-closestX, ship.y-closestY);
        if (dist < ship.size/2) {
          gameOver = true;
          playTone(300, 0.3); // laser collision
          break;
        }
      }
    }

    // win condition (reach exit cell bottom‑right)
    if (!gameOver && ship.x > (cols-1.5)*TILE && ship.y > (rows-1.5)*TILE) {
      alert('You escaped!');
      restart();
    }
  }

  function draw() {
    // background gradient for depth
    const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // draw walls with subtle lighting
    walls.forEach(w => {
      const x = w.x * TILE, y = w.y * TILE;
      const wallGrad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
      wallGrad.addColorStop(0, '#444');
      wallGrad.addColorStop(1, '#222');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(x, y, TILE, TILE);
    });
    // draw lasers with glow effect
    ctx.strokeStyle = 'rgba(255,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 10;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    });
    // reset shadow for subsequent drawing
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // draw ship with radial gradient
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.size * 0.1, ship.x, ship.y, ship.size / 2);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.size / 2, 0, Math.PI * 2);
    ctx.fill();
    // Game over overlay with shadow
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 5;
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Press Space to Restart', WIDTH / 2, HEIGHT / 2 + 40);
      ctx.shadowBlur = 0;
    }
  }

  function loop(ts) {
    const dt = last? (ts-last)/16 : 1; // approximate 60fps unit
    update(dt);
    draw();
    last = ts;
    requestAnimationFrame(loop);
  }
  let last = null;
  function rectIntersect(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }
  function restart(){
    ship.x = TILE/2; ship.y = TILE/2; ship.vx=ship.vy=0;
    gameOver=false;
  }
  requestAnimationFrame(loop);
})();
