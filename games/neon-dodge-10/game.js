// Simple Neon Dodge game
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or default 800x600
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup – simple synth sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let bgOsc;
  function startBackground(){
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 60; // low hum
    gain.gain.value = 0.02;
    bgOsc.connect(gain).connect(audioCtx.destination);
    bgOsc.start();
  }
  function stopBackground(){
    if (bgOsc){
      bgOsc.stop();
      bgOsc.disconnect();
    }
  }
  function playBeep(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  const player = {
    x: 80,
    y: canvas.height / 2,
    w: 20,
    h: 20,
    speed: 4,
    color: '#0ff',
    dx: 0,
    dy: 0,
  };

  const obstacles = [];
  const obstacleSpawnInterval = 800; // ms
  const obstacleSpeed = 2;
  let lastSpawn = 0;
  let lastInput = Date.now();
  const idleLimit = 10000; // ms
  let score = 0;
  let startTime = Date.now();
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', (e) => {
    // Ensure audio context runs after first interaction
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
      startBackground();
    }
    keys[e.key] = true;
    lastInput = Date.now();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  function update(dt) {
    // Player movement
    player.dx = 0;
    player.dy = 0;
    if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x + player.dx));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y + player.dy));

    // Spawn obstacles
    if (Date.now() - lastSpawn > obstacleSpawnInterval) {
      const size = 20 + Math.random() * 30;
      obstacles.push({
        x: canvas.width + size,
        y: Math.random() * (canvas.height - size),
        w: size,
        h: size,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      });
      lastSpawn = Date.now();
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Collision detection (AABB)
    for (const o of obstacles) {
        if (
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y
        ) {
          playBeep();
          gameOver = true;
          break;
        }
      }


    // Idle check
    if (Date.now() - lastInput > idleLimit) gameOver = true;

    // Update score
    score = Math.floor((Date.now() - startTime) / 1000);
  }

  function draw() {
    // Starfield background – dark radial gradient with scattered stars
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.1,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width
    );
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const sr = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player (neon triangle) with glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // reset shadow for other drawings
    // duplicate player drawing removed

    // Draw obstacles (neon rectangles)
    obstacles.forEach((o) => {
      // Neon glow for obstacles
      ctx.shadowBlur = 8;
      ctx.shadowColor = o.color;
      ctx.strokeStyle = o.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });
    // reset shadow after obstacles
    ctx.shadowBlur = 0;

    // Score text
    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
      return;
    }
    const now = Date.now();
    const dt = now - (timestamp || now);
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
