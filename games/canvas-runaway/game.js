// Simple Canvas Runaway game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Ship definition (triangle)
  const ship = {
    x: 100,
    y: height / 2,
    angle: 0, // radians, 0 = pointing right
    speed: 2,
    size: 20
  };

  // Game state
  let obstacles = [];
  let stars = [];
  let obstacleTimer = 0;
  let starTimer = 0;
  let level = 1;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });

  function spawnObstacle() {
    const heightObs = 40 + Math.random() * 60;
    const yPos = Math.random() * (height - heightObs);
    const speed = 2 + level * 0.5;
    obstacles.push({ x: width, y: yPos, w: 30, h: heightObs, speed });
  }

  function spawnStar() {
    const radius = 8;
    const yPos = Math.random() * (height - radius * 2) + radius;
    const speed = 2 + level * 0.5;
    stars.push({ x: width, y: yPos, r: radius, speed });
  }

  function update() {
    if (gameOver) return;

    // Ship rotation
    if (keys.left) ship.angle -= 0.05;
    if (keys.right) ship.angle += 0.05;

    // Move ship forward in its facing direction
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    // Off‑screen check (lose if outside canvas)
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      playTone(150, 0.4);
      gameOver = true;
    }

    // Obstacles
    obstacleTimer--;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = Math.max(60 - level * 5, 20);
    }
    obstacles.forEach(o => o.x -= o.speed);
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // Stars
    starTimer--;
    if (starTimer <= 0) {
      spawnStar();
      starTimer = 180;
    }
    stars.forEach(s => s.x -= s.speed);
    stars = stars.filter(s => s.x + s.r > 0);

    // Collision detection (simple point-in-rect for ship tip)
    const tipX = ship.x + Math.cos(ship.angle) * ship.size;
    const tipY = ship.y + Math.sin(ship.angle) * ship.size;
    for (const o of obstacles) {
      if (tipX > o.x && tipX < o.x + o.w && tipY > o.y && tipY < o.y + o.h) {
        playTone(300, 0.2);
        gameOver = true;
        break;
      }
    }
    // Star collection
    stars = stars.filter(s => {
      const dx = tipX - s.x;
      const dy = tipY - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < s.r) {
        playTone(600, 0.1);
        score++;
        if (score % 5 === 0) level++;
        return false; // remove collected star
      }
      return true;
    });
  }

  function draw() {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#001022');
    bg.addColorStop(1, '#000815');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Ship with glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = 'rgba(0, 200, 255, 0.6)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, -ship.size / 2);
    ctx.closePath();
    const shipGrad = ctx.createLinearGradient(-ship.size, -ship.size, ship.size, ship.size);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0; // reset

    // Obstacles with rounded corners and subtle shadow
    ctx.fillStyle = '#800';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    obstacles.forEach(o => {
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.w - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      ctx.lineTo(o.x + o.w, o.y + o.h - radius);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      ctx.lineTo(o.x + radius, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Stars with glow effect
    stars.forEach(s => {
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 180, 0.8)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0';
      ctx.fill();
      ctx.restore();
    });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Level: ${level}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
