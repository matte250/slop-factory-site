// Pixel Runner – minimal endless runner
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  canvas.width = 400;
  canvas.height = 200;

  // Game state
  const groundHeight = 20; // ground thickness
  const player = { x: 50, y: canvas.height - groundHeight - 8, w: 8, h: 8, vy: 0, onGround: true };
  const gravity = 0.5;
  const jumpStrength = -8;
  const obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let running = true;

  // Input handling – click or tap
  const jump = () => {
    if (player.onGround) {
      // Ensure audio context is running (required after user interaction)
      if (audioCtx.state !== 'running') audioCtx.resume();
      player.vy = jumpStrength;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  };
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  const rectCollision = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    // cloud spawn and movement
    cloudTimer++;
    if (cloudTimer >= cloudInterval) {
      cloudTimer = 0;
      const radius = 10 + Math.random() * 15; // 10-25px
      const yPos = 20 + Math.random() * 40; // between 20 and 60
      clouds.push({ x: canvas.width, y: yPos, r: radius });
    }
    clouds.forEach(c => c.x -= 1);
    while (clouds.length && clouds[0].x + clouds[0].r < 0) clouds.shift();
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= canvas.height - groundHeight) {
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles movement & spawn
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      const size = 5 + Math.random() * 5; // 5-10px spikes
      obstacles.push({ x: canvas.width, y: canvas.height - groundHeight - size, w: size, h: size });
    }
    obstacles.forEach(o => (o.x -= 3)); // move left
    // remove off-screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // collision detection
    for (const o of obstacles) {
      if (rectCollision(player, o)) {
          running = false;
          playTone(220, 0.3); // game over tone
          break;
        }
    }
    if (running) score++;
  };

  // Cloud state
  const clouds = [];
  let cloudTimer = 0;
  const cloudInterval = 200; // frames

  const draw = () => {
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#a0d8f1');
    skyGrad.addColorStop(1, '#e0f7ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // sun
    ctx.fillStyle = '#ffdd55';
    ctx.beginPath();
    ctx.arc(60, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    // player (circle)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2);
    ctx.fill();
    // obstacles as spikes (triangles)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.fillText('Score: ' + score, 10, 15);
  };

  const loop = () => {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
      ctx.fillText('Score: ' + score, canvas.width / 2 - 50, canvas.height / 2 + 30);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  loop();
})();
