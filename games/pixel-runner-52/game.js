// Simple side‑scrolling runner for canvas with id="game"
// Player jumps with Space or mouse click; obstacles spawn randomly.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 200;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
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
  const groundHeight = 30;
  const player = { x: 50, y: height - groundHeight - 30, w: 20, h: 30, vy: 0, jumpForce: -8, onGround: true };
  const gravity = 0.4;
  const obstacles = [];
  const clouds = [];
  let score = 0;
  let spawnTimer = 0;
  let cloudSpawnTimer = 0;

  const reset = () => {
    player.y = height - groundHeight - player.h;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    clouds.length = 0;
    score = 0;
    spawnTimer = 0;
    cloudSpawnTimer = 0;
  };

  const keyHandler = (e) => {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    // Ensure audio context is running (required by browsers after user interaction)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = player.jumpForce;
      player.onGround = false;
      // Jump sound
      playTone(440, 0.1);
    }
  };

  document.addEventListener('keydown', keyHandler);
  document.addEventListener('mousedown', keyHandler);

  function addObstacle() {
    const size = 20 + Math.random() * 30;
    const hue = 0; // red base
    const sat = 80 + Math.random() * 20; // variation per obstacle
    const color = `hsl(${hue}, ${sat}%, 50%)`;
    obstacles.push({ x: width, y: height - groundHeight - size, w: size, h: size, speed: 4 + Math.random() * 2, color });
  }

  function addCloud() {
    const w = 30 + Math.random() * 40;
    const h = w * 0.6;
    const y = 20 + Math.random() * (height / 2 - 40);
    clouds.push({ x: width, y, w, h, speed: 1 + Math.random() * 0.5 });
  }

  function update(delta) {
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= height - groundHeight) {
      player.y = height - groundHeight - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles
    spawnTimer -= delta;
    if (spawnTimer <= 0) {
      addObstacle();
      spawnTimer = 800 + Math.random() * 400; // ms until next obstacle
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      // collision
        if (
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y
        ) {
          // Collision sound
          playTone(200, 0.2);
          reset(); // restart on hit
          break;
        }
      // remove off‑screen
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // clouds (parallax background)
    cloudSpawnTimer -= delta;
    if (cloudSpawnTimer <= 0) {
      addCloud();
      cloudSpawnTimer = 1500 + Math.random() * 1000; // ms until next cloud
    }
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) clouds.splice(i, 1);
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#4a90e2'); // light blue top
    skyGrad.addColorStop(0.6, '#87ceeb'); // mid sky
    skyGrad.addColorStop(1, '#b0e0e6'); // near horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // Sun
    ctx.fillStyle = 'rgba(255,223,0,0.8)';
    ctx.beginPath();
    ctx.arc(width - 80, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    // Ground
    const groundHeight = 30;
    ctx.fillStyle = '#3b3b3b';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);
    // Clouds (simple ellipses)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // Player (simple pixel hero with outline)
    ctx.fillStyle = '#ff0';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.w, player.h);
    // Obstacles (different shades)
    obstacles.forEach(o => {
      ctx.fillStyle = o.color || '#f00';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  let last = performance.now();
  function loop(now) {
    const delta = now - last;
    last = now;
    update(delta);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
