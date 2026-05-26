// Minimal Pixel Runner implementation with sound
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first user interaction
  window.addEventListener('click', () => audioCtx.resume(), { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playTone(400, 0.08); }
  function playHit() { playTone(120, 0.3); }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 400;

  const player = {
    x: 50,
    y: H - 60,
    w: 40,
    h: 40,
    vy: 0,
    onGround: true,
    slide: false,
  };

  const obstacles = [];
  const clouds = [];
  let speed = 3;
  let distance = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'high' : 'low';
    const w = 20 + Math.random() * 30;
    const h = type === 'high' ? 60 : 30;
    const y = type === 'high' ? H - h - 20 : H - h - 20; // ground level
    obstacles.push({x: W, y, w, h});
  }

  function spawnCloud() {
    const r = 20 + Math.random() * 30;
    const x = W + r;
    const y = Math.random() * (H / 2);
    const speedFactor = 0.5; // slower than ground
    clouds.push({x, y, r, speedFactor});
  }

  function update() {
    if (gameOver) return;
    // player input
    if (keys['Space'] && player.onGround) {
      player.vy = -12;
      player.onGround = false;
      playJump();
    }
    if (keys['ArrowDown'] && player.onGround) {
      player.slide = true;
    } else {
      player.slide = false;
    }

    // physics
    player.vy += 0.6; // gravity
    player.y += player.vy;
    if (player.y >= H - 60) {
      player.y = H - 60;
      player.vy = 0;
      player.onGround = true;
    }
    // slide reduces height
    const ph = player.slide ? 20 : 40;
    const py = player.slide ? player.y + 20 : player.y;

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      // collision
      if (
        player.x < ob.x + ob.w &&
        player.x + player.w > ob.x &&
        py < ob.y + ob.h &&
        py + ph > ob.y
      ) {
        playHit();
        gameOver = true;
      }
      // remove off‑screen
      if (ob.x + ob.w < 0) obstacles.splice(i, 1);
    }

    // clouds movement
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= speed * c.speedFactor;
      if (c.x + c.r < 0) clouds.splice(i, 1);
    }
    // spawn logic
    if (Math.random() < 0.02) spawnObstacle();
    if (Math.random() < 0.01) spawnCloud();
    distance += speed * 0.1;
    speed += 0.001; // gradual acceleration
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#0a174e');
    skyGrad.addColorStop(1, '#1b3b7a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // parallax clouds
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ground
    ctx.fillStyle = '#342e2e';
    ctx.fillRect(0, H - 20, W, 20);
    // player with simple rounded shape
    const ph = player.slide ? 20 : 40;
    const py = player.slide ? player.y + 20 : player.y;
    ctx.fillStyle = '#00ff99';
    ctx.beginPath();
    ctx.moveTo(player.x, py + ph);
    ctx.lineTo(player.x + player.w, py + ph);
    ctx.quadraticCurveTo(player.x + player.w, py, player.x + player.w, py);
    ctx.lineTo(player.x, py);
    ctx.quadraticCurveTo(player.x, py + ph, player.x, py + ph);
    ctx.fill();
    // obstacles with varied colors
    obstacles.forEach(ob => {
      const hue = (ob.x / W) * 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Dist: ${Math.floor(distance)} m`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Distance: ${Math.floor(distance)} m`, W / 2, H / 2 + 20);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
