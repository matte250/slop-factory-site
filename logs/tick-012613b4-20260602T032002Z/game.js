// Simple Neon Dash endless runner
// Canvas with id "game" must exist in the hosting HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(600, 0.1);
  const playCrash = () => playTone(150, 0.3);
  const startMusic = () => {
    // Simple looping background drone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 80;
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 1);
    osc.start();
    // Store to stop later
    audioCtx._bgOsc = osc;
    audioCtx._bgGain = gain;
  };
  const stopMusic = () => {
    if (audioCtx._bgOsc) {
      audioCtx._bgGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      audioCtx._bgOsc.stop(audioCtx.currentTime + 0.5);
      audioCtx._bgOsc = null;
    }
  };
  // Start background music on user interaction (required by browsers)
  const initAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startMusic();
    canvas.removeEventListener('pointerdown', initAudio);
  };
  canvas.addEventListener('pointerdown', initAudio);

  // Full‑window canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recalculate lane height after resize
    LANE_HEIGHT = canvas.height / LANE_COUNT;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game constants
  const LANE_COUNT = 2;
  let LANE_HEIGHT = canvas.height / LANE_COUNT;
  const PLAYER_RADIUS = 15;
  const SPEED = 4; // pixels per frame
  const SPAWN_INTERVAL = 120; // frames between spawns

  // State
  let frame = 0;
  let score = 0;
  let gameOver = false;
  const player = { x: 50, lane: 0, y: () => player.lane * LANE_HEIGHT + LANE_HEIGHT / 2 };
  const orbs = [];
  const obstacles = [];

  // Input – toggle lane on click/tap
  canvas.addEventListener('pointerdown', () => {
    if (gameOver) return restart();
    player.lane = 1 - player.lane;
  });

  function spawnOrb() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const y = lane * LANE_HEIGHT + LANE_HEIGHT / 2;
    orbs.push({ x: canvas.width + 30, y, r: 10, collected: false });
  }
  function spawnObstacle() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const y = lane * LANE_HEIGHT + LANE_HEIGHT / 2;
    obstacles.push({ x: canvas.width + 30, y, w: 30, h: LANE_HEIGHT / 2 });
  }

  function restart() {
    score = 0;
    frame = 0;
    player.x = 50;
    player.lane = 0;
    orbs.length = 0;
    obstacles.length = 0;
    gameOver = false;
    // Restart background music
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startMusic();
    loop();
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = '#ff5555';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', canvas.width / 2, canvas.height / 2);
      return;
    }

    frame++;
    // Move player forward
    player.x += SPEED;

    // Move and prune objects
    const move = (arr) => arr.forEach(o => o.x -= SPEED);
    move(orbs);
    move(obstacles);
    while (orbs.length && orbs[0].x < -30) orbs.shift();
    while (obstacles.length && obstacles[0].x < -30) obstacles.shift();

    // Spawn
    if (frame % SPAWN_INTERVAL === 0) {
      if (Math.random() < 0.6) spawnOrb();
      if (Math.random() < 0.4) spawnObstacle();
    }

    // Collision detection
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y() - b.y);
    orbs.forEach(o => {
      if (!o.collected && dist(player, o) < PLAYER_RADIUS + o.r) {
        o.collected = true;
        score++;
        playCollect();
      }
    });
    obstacles.forEach(ob => {
      const withinX = player.x + PLAYER_RADIUS > ob.x && player.x - PLAYER_RADIUS < ob.x + ob.w;
      const withinY = player.y() - PLAYER_RADIUS < ob.y + ob.h && player.y() + PLAYER_RADIUS > ob.y;
      if (withinX && withinY) {
        gameOver = true;
        playCrash();
        stopMusic();
      }
    });

    // Clear with neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0d0d2b');
    bgGrad.addColorStop(1, '#1a1a3f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw neon grid with glow
    ctx.strokeStyle = '#44ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#44ffff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    for (let i = 0; i <= LANE_COUNT; i++) {
      const y = i * LANE_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw player (glowing neon circle)
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y(), PLAYER_RADIUS * 0.2,
      player.x, player.y(), PLAYER_RADIUS
    );
    playerGrad.addColorStop(0, '#44ffff');
    playerGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y(), PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // Outer glow
    ctx.shadowColor = '#44ffff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw orbs with neon glow
    orbs.forEach(o => {
      if (!o.collected) {
        const orbGrad = ctx.createRadialGradient(
          o.x, o.y, o.r * 0.2,
          o.x, o.y, o.r
        );
        orbGrad.addColorStop(0, '#ffff66');
        orbGrad.addColorStop(1, '#ff6600');
        ctx.fillStyle = orbGrad;
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw obstacles with neon glow
    obstacles.forEach(ob => {
      const obsGrad = ctx.createLinearGradient(ob.x, ob.y, ob.x + ob.w, ob.y + ob.h);
      obsGrad.addColorStop(0, '#ff4444');
      obsGrad.addColorStop(1, '#880000');
      ctx.fillStyle = obsGrad;
      ctx.shadowColor = '#ff2222';
      ctx.shadowBlur = 10;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    });
    // Reset shadow after obstacles
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);

    requestAnimationFrame(loop);
  }

  // Start the game loop
  loop();
})();
