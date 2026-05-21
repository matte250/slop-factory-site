// Meteor Dodge game with enhanced graphics
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Stars for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship
  const ship = {
    w: 30,
    h: 20,
    x: width / 2 - 15,
    y: height - 30,
    speed: 4,
    move: 0, // -1 left, 1 right
  };

  // Meteors
  const meteors = [];
  const meteorSpawnInterval = 800; // ms
  let lastSpawn = 0;

  // Score
  let score = 0;
  let startTime = null;
  let gameOver = false;

  // Input handling and audio setup
  const keys = {};
  // Audio context (created on first interaction to satisfy autoplay policies)
  let audioCtx = null;
  const ensureAudioCtx = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };
  const playTone = (freq, duration = 0.1) => {
    ensureAudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollision = () => playTone(80, 0.4); // low thump
  const playMove = () => playTone(440, 0.05);
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      keys.left = true;
      playMove();
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      keys.right = true;
      playMove();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  function spawnMeteor() {
    const size = Math.random() * 20 + 10; // 10-30px radius
    const speed = Math.random() * 2 + 1; // 1-3 px/frame
    meteors.push({
      x: Math.random() * (width - size * 2) + size,
      y: -size,
      r: size,
      speed,
    });
  }

  function update(dt) {
    // ship movement
    ship.move = 0;
    if (keys.left) ship.move -= 1;
    if (keys.right) ship.move += 1;
    ship.x += ship.move * ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // remove off-screen
      if (m.y - m.r > height) meteors.splice(i, 1);
    }

    // collisions
    for (const m of meteors) {
      const shipRect = {x: ship.x, y: ship.y, w: ship.w, h: ship.h};
      const closestX = Math.max(shipRect.x, Math.min(m.x, shipRect.x + shipRect.w));
      const closestY = Math.max(shipRect.y, Math.min(m.y, shipRect.y + shipRect.h));
      const dx = m.x - closestX;
      const dy = m.y - closestY;
      if (dx * dx + dy * dy < m.r * m.r) {
        playCollision();
        gameOver = true;
        break;
      }
    }

    // score based on time survived
    if (!startTime) startTime = performance.now();
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship (triangle) with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // meteors with glow gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(255,165,0,0.9)'); // orange core
      grad.addColorStop(1, 'rgba(255,69,0,0)');   // transparent edge
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 40);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      if (timestamp - lastSpawn > meteorSpawnInterval) {
        spawnMeteor();
        lastSpawn = timestamp;
      }
      update(timestamp);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start loop after ensuring canvas is ready
  if (canvas) requestAnimationFrame(loop);
})();
