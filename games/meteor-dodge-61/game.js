// Meteor Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playHitSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  const width = canvas.width = canvas.width || 800;
  const height = canvas.height = canvas.height || 600;

  // Ship settings
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const ship = { w: 50, h: 20, x: width / 2 - 25, y: height - 30, speed: 5 };
  const keys = { left: false, right: false };

  // Meteor settings
  const meteors = [];
  let meteorSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let meteorSpeed = 2;

  // Score
  let startTime = null;
  let score = 0;
  let gameOver = false;

  const onKeyDown = e => {
    // Ensure audio context is running on first interaction
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  };
  const onKeyUp = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function spawnMeteor() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    meteors.push({ x, y: -radius, r: radius, speed: meteorSpeed + Math.random() });
    playSpawnSound();
  }
  function playSpawnSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 300;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }

  function update(dt) {
    // ship movement
    if (keys.left) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.right) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // remove off-screen
      if (m.y - m.r > height) meteors.splice(i, 1);
    }

    // stars – slight downward drift to simulate movement
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.3; // slow drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // collision detection
    for (const m of meteors) {
      const shipCenterX = ship.x + ship.w / 2;
      const shipCenterY = ship.y + ship.h / 2;
      const dx = Math.abs(m.x - shipCenterX) - ship.w / 2;
      const dy = Math.abs(m.y - shipCenterY) - ship.h / 2;
      if (dx < m.r && dy < m.r) {
        playHitSound();
        gameOver = true;
        break;
      }
    }

    // spawn logic
    if (Date.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = Date.now();
    }

    // increase difficulty over time
    const elapsed = (Date.now() - startTime) / 1000;
    meteorSpeed = 2 + elapsed * 0.02; // gradual speed increase
    meteorSpawnInterval = Math.max(300, 1500 - elapsed * 10); // faster spawns
    score = Math.floor(elapsed);
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars field
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship – draw as a simple triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // meteors – radial gradient for a glowing effect
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(180,180,180,0.9)');
      grad.addColorStop(1, 'rgba(100,100,100,0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff6';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    if (!gameOver) {
      const dt = timestamp - (lastFrame || timestamp);
      update(dt);
    }
    draw();
    if (!gameOver) {
      lastFrame = timestamp;
      requestAnimationFrame(loop);
    } else {
      // stop listening to input
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
  }

  let lastFrame = null;
  requestAnimationFrame(loop);
})();
