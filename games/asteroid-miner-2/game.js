// Asteroid Miner – simple canvas game
// Canvas with id "game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio context for simple tones
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Game settings
  const PLAYER_SIZE = 20;
  const PLAYER_SPEED = 4;
  const ASTEROID_SIZE = 30;
  const ASTEROID_SPEED = 1.5;
  const ORE_SIZE = 10;
  const ORE_COUNT = 10;
  const ASTEROID_COUNT = 5;
  const REQUIRED_ORE = 5;
  const MAX_HEALTH = 3;

  // State
  let player = { x: width / 2, y: height / 2, dx: 0, dy: 0, health: MAX_HEALTH, ore: 0 };
  let asteroids = [];
  let ore = [];
  let keys = {};
  let gameOver = false;
  let win = false;

  // Initialize objects
  // starfield for background
  const stars = Array.from({ length: 50 }, () => ({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 + 1 }));
  const randPos = (size) => ({ x: Math.random() * (width - size), y: Math.random() * (height - size) });
  for (let i = 0; i < ASTEROID_COUNT; i++) asteroids.push({
    ...randPos(ASTEROID_SIZE),
    vx: (Math.random() - 0.5) * ASTEROID_SPEED,
    vy: (Math.random() - 0.5) * ASTEROID_SPEED,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    size: ASTEROID_SIZE
  });
  for (let i = 0; i < ORE_COUNT; i++) ore.push({ ...randPos(ORE_SIZE), size: ORE_SIZE, collected: false });

  // Input handling
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update() {
    if (gameOver) return;
    // Player movement
    player.dx = 0; player.dy = 0;
    if (keys.ArrowLeft) player.dx = -PLAYER_SPEED;
    if (keys.ArrowRight) player.dx = PLAYER_SPEED;
    if (keys.ArrowUp) player.dy = -PLAYER_SPEED;
    if (keys.ArrowDown) player.dy = PLAYER_SPEED;
    player.x = Math.max(0, Math.min(width - PLAYER_SIZE, player.x + player.dx));
    player.y = Math.max(0, Math.min(height - PLAYER_SIZE, player.y + player.dy));

    // Move asteroids
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      a.angle += a.rotSpeed; // rotate asteroid
      if (a.x < 0 || a.x > width - a.size) a.vx *= -1;
      if (a.y < 0 || a.y > height - a.size) a.vy *= -1;
    });

    // Check collisions with ore
    ore.forEach(o => {
      if (o.collected) return;
      if (rectIntersect(player, PLAYER_SIZE, o, o.size)) {
        o.collected = true;
        player.ore++;
        playTone(440, 0.1); // ore collection sound
        if (player.ore >= REQUIRED_ORE) {
          win = true;
          playTone(880, 0.3); // win sound
        }
      }
    });

    // Check collisions with asteroids
    asteroids.forEach(a => {
      if (rectIntersect(player, PLAYER_SIZE, a, a.size)) {
        player.health--;
        playTone(220, 0.2); // damage sound
        // push player back to centre to avoid rapid repeat hits
        player.x = width / 2;
        player.y = height / 2;
        if (player.health <= 0) {
          gameOver = true;
          playTone(110, 0.5); // game over sound
        }
      }
    });
  }

  function rectIntersect(obj1, size1, obj2, size2) {
    return !(obj1.x + size1 < obj2.x ||
             obj1.x > obj2.x + size2 ||
             obj1.y + size1 < obj2.y ||
             obj1.y > obj2.y + size2);
  }

  function draw() {
    // Clear background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ore as circles
    ore.forEach(o => {
      if (o.collected) return;
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(o.x + o.size/2, o.y + o.size/2, o.size/2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw asteroids with rotation
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size/2, a.y + a.size/2);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.size/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw player ship as triangle
    ctx.fillStyle = 'cyan';
    ctx.save();
    ctx.translate(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2);
    ctx.beginPath();
    ctx.moveTo(0, -PLAYER_SIZE/2);
    ctx.lineTo(PLAYER_SIZE/2, PLAYER_SIZE/2);
    ctx.lineTo(-PLAYER_SIZE/2, PLAYER_SIZE/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Health: ${player.health}`, 10, 20);
    ctx.fillText(`Ore: ${player.ore}/${REQUIRED_ORE}`, 10, 40);
    if (win) ctx.fillText('You Win!', width / 2 - 40, height / 2);
    if (gameOver) ctx.fillText('Game Over', width / 2 - 50, height / 2);
  }

  function loop() {
    update();
    draw();
    if (!gameOver && !win) requestAnimationFrame(loop);
  }

  // Start game loop
  requestAnimationFrame(loop);
})();
