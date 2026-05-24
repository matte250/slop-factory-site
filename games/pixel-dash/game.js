// Minimal endless runner based on IDEA.md
// Targets <canvas id="game"></canvas>

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is running after first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };

  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  const groundY = height - 30;
  const player = { x: 50, y: groundY - 20, w: 20, h: 20, vy: 0, jumpForce: -9 };
  const gravity = 0.5;

  let obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 120; // frames
  let speed = 3; // base obstacle speed
  let speedIncrease = 0.001; // per frame
  let score = 0;
  let running = true;

  const reset = () => {
    player.y = groundY - player.h;
    player.vy = 0;
    obstacles = [];
    spawnTimer = 0;
    speed = 3;
    score = 0;
    running = true;
    requestAnimationFrame(loop);
  };

  const jump = () => {
    if (player.y >= groundY - player.h) {
      player.vy = player.jumpForce;
      playTone(440, 0.1); // jump sound
    }
  };

  // Input handling
  document.addEventListener('keydown', e => { if (e.code === 'Space') { resumeAudio(); jump(); } });
  canvas.addEventListener('mousedown', () => { resumeAudio(); jump(); });

  const loop = () => {
    if (!running) return;

    // Update player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y > groundY - player.h) {
      player.y = groundY - player.h;
      player.vy = 0;
    }

    // Spawn obstacles
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      const size = 20 + Math.random() * 30;
      obstacles.push({ x: width, y: groundY - size, w: size, h: size });
      // Decrease interval slightly to increase difficulty
      spawnInterval = Math.max(60, spawnInterval - 1);
    }

    // Move obstacles and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      // collision
      if (
        player.x < ob.x + ob.w &&
        player.x + player.w > ob.x &&
        player.y < ob.y + ob.h &&
        player.y + player.h > ob.y
      ) {
        running = false;
        playTone(200, 0.3); // collision sound
        // simple restart after short delay
        setTimeout(reset, 1500);
      }
      // remove off‑screen
      if (ob.x + ob.w < 0) obstacles.splice(i, 1);
    }

    // Increase speed gradually
    speed += speedIncrease;
    // Update score based on distance travelled
    score++;

    // Render
    ctx.clearRect(0, 0, width, height);
    // sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // ground with darker gradient
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#333');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, height - groundY);
    // player with rounded rectangle and gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#0f8');
    playerGrad.addColorStop(1, '#0c0');
    ctx.fillStyle = playerGrad;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // obstacles with gradient and rounded corners
    obstacles.forEach(ob => {
      const obGrad = ctx.createLinearGradient(ob.x, ob.y, ob.x, ob.y + ob.h);
      obGrad.addColorStop(0, '#f88');
      obGrad.addColorStop(1, '#c00');
      ctx.fillStyle = obGrad;
      const r = 3;
      ctx.beginPath();
      ctx.moveTo(ob.x + r, ob.y);
      ctx.lineTo(ob.x + ob.w - r, ob.y);
      ctx.quadraticCurveTo(ob.x + ob.w, ob.y, ob.x + ob.w, ob.y + r);
      ctx.lineTo(ob.x + ob.w, ob.y + ob.h - r);
      ctx.quadraticCurveTo(ob.x + ob.w, ob.y + ob.h, ob.x + ob.w - r, ob.y + ob.h);
      ctx.lineTo(ob.x + r, ob.y + ob.h);
      ctx.quadraticCurveTo(ob.x, ob.y + ob.h, ob.x, ob.y + ob.h - r);
      ctx.lineTo(ob.x, ob.y + r);
      ctx.quadraticCurveTo(ob.x, ob.y, ob.x + r, ob.y);
      ctx.closePath();
      ctx.fill();
    });
    // score display
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    requestAnimationFrame(loop);
  };

  // Start game
  reset();
})();
