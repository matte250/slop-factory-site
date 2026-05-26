// Simple Meteor Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Create simple starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  // Ship definition
  const ship = {
    width: 60,
    height: 20,
    x: width / 2 - 30,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // Draw ship as a triangle with a gradient fill for better visual
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      grad.addColorStop(0, '#0af');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Meteor definition
  const meteors = [];
  let spawnTimer = 0;
  // Audio setup
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
  const spawnInterval = 1000; // ms
  let lastTime = 0;
  let gameOver = false;
  let score = 0;
  let meteorSpeed = 2;

  function spawnMeteor() {
    // Play spawn sound
    playTone(300, 0.1);
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    meteors.push({ x, y: -radius, radius, speed: meteorSpeed });
  }

  function update(delta) {
    if (gameOver) return;
    // Move ship
    ship.x += ship.dx;
    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.width > width) ship.x = width - ship.width;

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off‑screen meteors and increase score
      if (m.y - m.radius > height) {
        meteors.splice(i, 1);
        score++;
        // Gradually increase difficulty
        if (score % 5 === 0) meteorSpeed += 0.5;
        continue;
      }
      // Collision check (simple rectangle‑circle test)
      const shipTop = ship.y;
      const shipBottom = ship.y + ship.height;
      const shipLeft = ship.x;
      const shipRight = ship.x + ship.width;
      const closestX = Math.max(shipLeft, Math.min(m.x, shipRight));
      const closestY = Math.max(shipTop, Math.min(m.y, shipBottom));
      const distX = m.x - closestX;
      const distY = m.y - closestY;
      if (distX * distX + distY * distY < m.radius * m.radius) {
        // Play collision sound
        playTone(200, 0.3);
        gameOver = true;
      }
    }
  }

  function render() {
    // Dark space background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, width, height);
    // Draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ship.draw();
    // Draw meteors with gradient fill
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
      grad.addColorStop(0, '#ff6');
      grad.addColorStop(1, '#a33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      spawnMeteor();
      spawnTimer = 0;
    }
    update(delta);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.key === 'ArrowLeft') ship.dx = -ship.speed;
    else if (e.key === 'ArrowRight') ship.dx = ship.speed;
    else if (e.key === 'Enter' && gameOver) restart();
  });
  window.addEventListener('keyup', e => {
    if ((e.key === 'ArrowLeft' && ship.dx < 0) || (e.key === 'ArrowRight' && ship.dx > 0)) {
      ship.dx = 0;
    }
  });

  function restart() {
    meteors.length = 0;
    ship.x = width / 2 - ship.width / 2;
    ship.dx = 0;
    score = 0;
    meteorSpeed = 2;
    gameOver = false;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
