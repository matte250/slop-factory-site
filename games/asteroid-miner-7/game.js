// Asteroid Miner game implementation
// Canvas element with id="game" is assumed present in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill window and create star field
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // generate simple star background
    stars = [];
    const starCount = Math.floor(canvas.width * canvas.height * 0.0001);
    for (let i = 0; i < starCount; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
    }
  };
  window.addEventListener('resize', resize);
  resize();

  // Game state
  const player = {
    angle: 0, // movement direction in radians

    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 15,
    speed: 4,
    shield: 100,
    score: 0,
  };
  const ore = [];
  const asteroids = [];
  const oreSpawnRate = 0.02; // per frame
  const asteroidSpawnRate = 0.01;
  const maxOre = 30;
  const maxAsteroids = 20;
  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (frequency, type = 'sine', duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };

  // Input handling
  // Resume audio context on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const random = (min, max) => Math.random() * (max - min) + min;

  const spawnOre = () => {
    if (ore.length >= maxOre) return;
    ore.push({
      x: random(0, canvas.width),
      y: random(0, canvas.height),
      r: 8,
    });
  };

  const spawnAsteroid = () => {
    if (asteroids.length >= maxAsteroids) return;
    // Asteroids have a velocity to move across the field
    const angle = random(0, Math.PI * 2);
    const speed = random(1, 3);
    asteroids.push({
      x: random(0, canvas.width),
      y: random(0, canvas.height),
      r: 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  };

  const updatePlayer = () => {
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Wrap around edges (infinite field illusion)
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;
    if (player.y < 0) player.y = canvas.height;
    if (player.y > canvas.height) player.y = 0;
  };

  const rectDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const checkCollisions = () => {
    // Ore collection
    for (let i = ore.length - 1; i >= 0; i--) {
      if (rectDist(player, ore[i]) < player.r + ore[i].r) {
        player.score++;
        ore.splice(i, 1);
        // play collection sound
        playSound(660, 'sine', 0.08);
      }
    }
    // Asteroid impact
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (rectDist(player, a) < player.r + a.r) {
        player.shield -= 20;
        asteroids.splice(i, 1);
        // play hit sound
        playSound(200, 'sawtooth', 0.2);
        if (player.shield <= 0) player.shield = 0;
      }
    }
  };

  const updateAsteroids = () => {
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      // Wrap
      if (a.x < 0) a.x = canvas.width;
      if (a.x > canvas.width) a.x = 0;
      if (a.y < 0) a.y = canvas.height;
      if (a.y > canvas.height) a.y = 0;
    });
  };

  const draw = () => {
    // Background gradient (space night)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001028');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star field with twinkling effect
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5; // flicker
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Player drone – green triangle with glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.7)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.lineTo(player.x + player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Ore (bright yellow)
    ctx.fillStyle = '#ff0';
    ore.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Asteroids (gray with gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI – white text with subtle outline
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = '16px sans-serif';
    const scoreText = `Score: ${player.score}`;
    ctx.strokeText(scoreText, 10, 20);
    ctx.fillText(scoreText, 10, 20);
    const shieldText = `Shield: ${player.shield}`;
    ctx.strokeText(shieldText, 10, 40);
    ctx.fillText(shieldText, 10, 40);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const timeText = `Time: ${elapsed}s`;
    ctx.strokeText(timeText, 10, 60);
    ctx.fillText(timeText, 10, 60);
  };

  const loop = () => {
    if (player.shield <= 0) {
      // play game over sound
      playSound(100, 'sine', 0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
      return;
    }
    // Spawn
    if (Math.random() < oreSpawnRate) spawnOre();
    if (Math.random() < asteroidSpawnRate) spawnAsteroid();
    updatePlayer();
    updateAsteroids();
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  };

  const startTime = Date.now();
  requestAnimationFrame(loop);
})();
