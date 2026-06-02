// Neon Runner implementation
// Canvas with id="game"
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set fixed size (can be overridden by CSS)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60; // low hum
  bgOsc.type = 'sine';
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);

  function startAudio(){
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (!audioStarted) {
      bgOsc.start();
      audioStarted = true;
    }
  }

  // Start audio on first user interaction
  window.addEventListener('keydown', e => { if (!audioStarted) startAudio(); });

  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  const player = { x: canvas.width / 2, y: canvas.height - 30, radius: 10, speed: 5 };
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 1000; // ms
  let lastTime = 0;
  let gameSpeed = 2; // falling speed
  let score = 0;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const width = 20 + Math.random() * 30;
    const x = Math.random() * (canvas.width - width);
    obstacles.push({ x, y: -20, width, height: 20 });
    // sound for new obstacle
    playBeep(300, 0.05);
  }

  function update(dt) {
    // player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));

    // obstacles
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += gameSpeed;
      // collision detection (circle-rect)
      const distX = Math.abs(player.x - (o.x + o.width / 2));
      const distY = Math.abs(player.y - (o.y + o.height / 2));
        if (distX > (o.width / 2 + player.radius) || distY > (o.height / 2 + player.radius)) {
          // no collision
        } else if (distX <= (o.width / 2) || distY <= (o.height / 2)) {
          running = false; // direct overlap
          playBeep(120, 0.3); // crash sound
        } else {
          const dx = distX - o.width / 2;
          const dy = distY - o.height / 2;
          if (dx * dx + dy * dy <= player.radius * player.radius) {
            running = false;
            playBeep(120, 0.3);
          }
        }
      if (o.y > canvas.height) {
        obstacles.splice(i, 1);
        score++;
        // increase speed slightly every successful dodge
        gameSpeed += 0.02;
      }
    }
  }

  function draw() {
    // Fade trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#010');
    ctx.fillStyle = bgGrad;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    // player with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // reset shadow for obstacles
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 10;
    // obstacles with gradient fill
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.width, o.y + o.height);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    });
    // reset shadows for UI text
    ctx.shadowBlur = 0;
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
