// Simple side‑scroll game based on IDEA.md
// Canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 400;

  // Game state
  const player = {
    x: 100,
    y: 50,
    w: 30,
    h: 40,
    vx: 0,
    vy: 0,
    gravity: 0.4,
    tiltSpeed: 0.3,
    boostPower: -8,
    parachuteDeployed: false,
    boostTimer: 0,
    boostDuration: 12 // frames
  };

  const buildings = [];
  const coins = [];
  const birds = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playBoost() { ensureAudio(); playBeep(600, 150); }
  function playCoin() { ensureAudio(); playBeep(800, 100); }
  function playCrash() { ensureAudio(); playBeep(200, 300); }
  function ensureAudio() { if (audioCtx.state !== 'running') { audioCtx.resume(); } }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && !player.parachuteDeployed) {
      player.parachuteDeployed = true;
      player.boostTimer = player.boostDuration;
      playBoost();
    }
  });
  window.addEventListener('keyup', e => { delete keys[e.code]; });

  function spawnBuilding() {
    const w = 80 + Math.random() * 40;
    const h = 60 + Math.random() * 80;
    buildings.push({ x: WIDTH, y: HEIGHT - h, w, h });
  }
  function spawnCoin() {
    const x = WIDTH + Math.random() * 200;
    const y = HEIGHT - 150 - Math.random() * 100;
    coins.push({ x, y, r: 8, collected: false });
  }
  function spawnBird() {
    const x = WIDTH;
    const y = 50 + Math.random() * (HEIGHT - 200);
    birds.push({ x, y, w: 30, h: 20, vx: -3 });
  }

  function update() {
    if (gameOver) return;

    // player physics
    if (keys['ArrowLeft']) player.vx = -player.tiltSpeed;
    else if (keys['ArrowRight']) player.vx = player.tiltSpeed;
    else player.vx = 0;

    if (player.boostTimer > 0) {
      player.vy = player.boostPower;
      player.boostTimer--;
    } else {
      player.vy += player.gravity;
    }

    player.x += player.vx * 5; // amplify horizontal motion
    player.y += player.vy;
    // keep within horizontal bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > WIDTH) player.x = WIDTH - player.w;

    // scroll world left
    const scrollSpeed = 2;
    buildings.forEach(b => b.x -= scrollSpeed);
    coins.forEach(c => c.x -= scrollSpeed);
    birds.forEach(b => b.x -= scrollSpeed);

    // remove off‑screen objects
    while (buildings.length && buildings[0].x + buildings[0].w < 0) buildings.shift();
    while (coins.length && coins[0].x + coins[0].r < 0) coins.shift();
    while (birds.length && birds[0].x + birds[0].w < 0) birds.shift();

    // spawn new objects periodically
    if (frames % 120 === 0) spawnBuilding();
    if (frames % 90 === 0) spawnCoin();
    if (frames % 200 === 0) spawnBird();

    // collision detection
    for (const b of buildings) {
      if (player.x < b.x + b.w && player.x + player.w > b.x &&
          player.y + player.h > b.y) {
        gameOver = true;
        playCrash();
      }
    }
    for (const c of coins) {
      if (!c.collected &&
          Math.hypot((player.x + player.w/2) - c.x, (player.y + player.h/2) - c.y) < c.r + Math.min(player.w, player.h)/2) {
        c.collected = true;
        score += 10;
        playCoin();
      }
    }
    for (const b of birds) {
      if (player.x < b.x + b.w && player.x + player.w > b.x &&
          player.y < b.y + b.h && player.y + player.h > b.y) {
        gameOver = true;
      }
    }

    // ground and parachute loss condition
    const groundY = HEIGHT;
    if (player.y + player.h >= groundY) {
      if (!player.parachuteDeployed) gameOver = true;
      player.y = groundY - player.h;
      player.vy = 0;
    }

    frames++;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // background with gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ground with gradient
    const groundGrad = ctx.createLinearGradient(0, HEIGHT - 20, 0, HEIGHT);
    groundGrad.addColorStop(0, '#8B4513'); // saddle brown
    groundGrad.addColorStop(1, '#654321'); // dark brown
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);

    // draw buildings with simple shading and windows
    const buildingGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    buildingGrad.addColorStop(0, '#777');
    buildingGrad.addColorStop(1, '#333');
    ctx.fillStyle = buildingGrad;
    for (const b of buildings) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // windows
      ctx.fillStyle = '#FFD700'; // gold windows
      const winW = 8, winH = 10;
      const cols = Math.floor(b.w / (winW + 5));
      const rows = Math.floor(b.h / (winH + 5));
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const wx = b.x + 5 + i * (winW + 5);
          const wy = b.y + 5 + j * (winH + 5);
          ctx.fillRect(wx, wy, winW, winH);
        }
      }
      // reset fill for next building
      ctx.fillStyle = buildingGrad;
    }
    // draw coins with radial gradient shine
    for (const c of coins) {
      if (!c.collected) {
        const grad = ctx.createRadialGradient(c.x - c.r/3, c.y - c.r/3, c.r/4, c.x, c.y, c.r);
        grad.addColorStop(0, '#fff700'); // bright center
        grad.addColorStop(1, '#b8860b'); // dark gold edge
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // draw birds
    ctx.fillStyle = 'black';
    for (const b of birds) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    // draw player (parachutist) with simple silhouette
    // head
    ctx.fillStyle = '#ffcc99';
    const headRadius = player.w/3;
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + headRadius, headRadius, 0, Math.PI * 2);
    ctx.fill();
    // body (triangle)
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w/2, player.y + headRadius*2);
    ctx.lineTo(player.x + player.w/4, player.y + player.h);
    ctx.lineTo(player.x + 3*player.w/4, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // parachute visual
    if (player.parachuteDeployed) {
      const paraGrad = ctx.createRadialGradient(
        player.x + player.w/2, player.y, player.w/2,
        player.x + player.w/2, player.y, player.w
      );
      paraGrad.addColorStop(0, '#ffffff');
      paraGrad.addColorStop(1, '#cccccc');
      ctx.fillStyle = paraGrad;
      ctx.beginPath();
      ctx.arc(player.x + player.w/2, player.y, player.w, Math.PI, 0);
      ctx.fill();
      // cords
      ctx.strokeStyle = '#777';
      ctx.beginPath();
      ctx.moveTo(player.x + player.w/4, player.y + headRadius*2);
      ctx.lineTo(player.x + player.w/2, player.y);
      ctx.moveTo(player.x + 3*player.w/4, player.y + headRadius*2);
      ctx.lineTo(player.x + player.w/2, player.y);
      ctx.stroke();
    }
    // UI
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH/2, HEIGHT/2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // start the game after resources are ready
  window.addEventListener('load', () => {
    // ensure canvas size matches CSS if any
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    loop();
  });
})();
