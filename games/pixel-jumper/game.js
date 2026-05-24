// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function ensureAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
  // Resume audio on first interaction
  window.addEventListener('keydown', ensureAudio, { once: true });
  window.addEventListener('click', ensureAudio, { once: true });

  // Starfield background
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  }));

  // Player ship
  const ship = { x: 50, y: height / 2, w: 20, h: 20, dy: 0, speed: 4 };

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  const obstacleSpeed = 3;
  let lastObstacle = 0;

  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const y = Math.random() * (height - size);
    obstacles.push({ x: width, y, w: size, h: size });
  }

  function update(dt) {
    // Update stars background
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    else if (keys['ArrowDown']) ship.dy = ship.speed;
    else ship.dy = 0;
    ship.y += ship.dy;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= obstacleSpeed;
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    if (performance.now() - lastObstacle > obstacleFreq) {
      spawnObstacle();
      playTone(200, 100); // spawn sound
      lastObstacle = performance.now();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        playTone(400, 200); // collision sound
        gameOver = true;
        break;
      }
    }

    // Score (time based)
    score = Math.floor(performance.now() / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00f');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Obstacles
    ctx.fillStyle = '#f00';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
