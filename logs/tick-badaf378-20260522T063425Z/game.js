// Simple top‑down endless runner targeting canvas with id "game"
(function() {
  // Enhanced graphics: background gradient, stars, and shaded shapes
  const stars = [];
  const maxStars = 100;
  for (let i = 0; i < maxStars; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
  }
  const canvas = document.getElementById('game');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // set canvas size to fill parent
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = { x: canvas.width/2, y: canvas.height*0.8, size: 15, speed: 2 };
  const keys = { ArrowLeft: false, ArrowRight: false };
  const obstacles = [];
  let distance = 0;
  const obstacleSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Input handling
  window.addEventListener('keydown', e => {
  // resume audio context on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = true;
    // play movement sound: different freq for left/right
    const freq = e.key === 'ArrowLeft' ? 440 : 660;
    playTone(freq, 0.08);
  }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
  });

  function spawnObstacle() {
    const size = 20 + Math.random()*10;
    const x = Math.random() * (canvas.width - size);
    obstacles.push({ x, y: -size, size, speed: 2 + Math.random()*2 });
    // play spawn sound
    playTone(300, 0.05);
  }

  function update(dt) {
    // move stars (background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
    // move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep in bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > canvas.height) obstacles.splice(i, 1);
    }

    // spawn
    if (performance.now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // collision detection (simple AABB vs triangle point)
    for (const o of obstacles) {
      const dx = Math.abs(player.x - (o.x + o.size/2));
      const dy = Math.abs(player.y - (o.y + o.size/2));
      if (dx < player.size && dy < o.size/2) {
        // game over
        alert('Game Over! Distance: ' + Math.floor(distance));
        // reset
        obstacles.length = 0;
        distance = 0;
        player.x = canvas.width/2;
        break;
      }
    }
    distance += dt * 0.1; // arbitrary scaling
  }

  function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw stars
  ctx.fillStyle = 'white';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
    // fade previous frame for motion blur effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // draw player triangle pointing up with gradient
    const playerGrad = ctx.createLinearGradient(player.x - player.size, player.y - player.size, player.x + player.size, player.y + player.size);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#00f');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size, player.y + player.size);
    ctx.lineTo(player.x + player.size, player.y + player.size);
    ctx.closePath();
    ctx.fill();
    // draw obstacles (triangles pointing down) with gradient shading
    for (const o of obstacles) {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x + o.size, o.y + o.size);
      obsGrad.addColorStop(0, '#f44');
      obsGrad.addColorStop(1, '#800');
      ctx.fillStyle = obsGrad;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + o.size, o.y);
      ctx.lineTo(o.x + o.size/2, o.y + o.size);
      ctx.closePath();
      ctx.fill();
    }
    // draw score with glow
    ctx.fillStyle = 'gold';
    ctx.font = '20px sans-serif';
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 8;
    ctx.fillText('Score: ' + Math.floor(distance), 10, 30);
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
