// Canvas Dodger Game
// Assumes <canvas id="game"></canvas> exists in the HTML.
(() => {
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
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Slight background hum (optional)
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60; // low hum
  bgOsc.type = 'sine';
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  bgOsc.start();
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  const player = { x: canvas.width / 2, y: canvas.height - 30, r: 15, speed: 5 };
  const obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 90; // frames
  let speedFactor = 1;
  let score = 0;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const vel = 2 + Math.random() * 2;
    // Random pastel color and slight rotation for visual variety
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 60%)`;
    const angle = Math.random() * Math.PI * 2;
    obstacles.push({ x, y, w: size, h: size, vy: vel, color, angle });
    // obstacle spawn sound
    playBeep(300, 0.1);
  }

  function update() {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));

    // obstacles
    spawnTimer++;
    if (spawnTimer > spawnInterval) {
      spawnObstacle();
      spawnTimer = 0;
      // gradually increase difficulty
      if (spawnInterval > 30) spawnInterval -= 0.5;
      speedFactor += 0.002;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.vy * speedFactor;
      // collision detection (circle-rect)
      const dx = Math.max(o.x - player.x, 0, player.x - (o.x + o.w));
      const dy = Math.max(o.y - player.y, 0, player.y - (o.y + o.h));
      if (dx * dx + dy * dy < player.r * player.r) {
        running = false;
        // collision sound
        playBeep(150, 0.3);
      }
      // remove off‑screen
      if (o.y > canvas.height) obstacles.splice(i, 1);
    }
    if (running) score++;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#e0f7fa');
    bgGrad.addColorStop(1, '#e0f2f1');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // player with radial gradient
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.r * 0.2,
      player.x, player.y, player.r
    );
    playerGrad.addColorStop(0, '#ffeb3b');
    playerGrad.addColorStop(1, '#f57c00');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // obstacles with individual colors and rotation
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.angle);
      ctx.fillStyle = o.color || 'crimson';
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    });

    // score overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Score: ' + Math.floor(score / 60), canvas.width / 2, canvas.height / 2 + 30);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
