// Meteor Dodge game
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions to fill its container or default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = {
    radius: 15,
    x: canvas.width / 2,
    y: canvas.height - 60,
    speed: 4,
    lives: 3,
    color: '#00f',
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const meteors = [];
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  let globalSpeed = 1.5; // base falling speed, will accelerate
  let startTime = performance.now();
  let gameOver = false;
  let score = 0;

  function spawnMeteor() {
    // play spawn sound
    playSound(300, 0.1);
    const radius = Math.random() * 12 + 8;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    meteors.push({ x, y: -radius, radius, speed: globalSpeed + Math.random() * 1 });
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // spawn meteors
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * dt * 0.06; // adjust for ms
      if (m.y - m.radius > canvas.height) {
        meteors.splice(i, 1);
        continue;
      }
      // collision with ship (circle vs circle approximation)
      const dx = m.x - ship.x;
      const dy = m.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < m.radius + ship.radius) {
        // collision sound
        playSound(100, 0.2);
        ship.lives--;
        meteors.splice(i, 1);
        if (ship.lives <= 0) {
          gameOver = true;
          // game over sound
          playSound(50, 0.5);
        }
      }
    }

    // accelerate difficulty
    globalSpeed += dt * 0.00002; // subtle acceleration
    // update score (seconds survived)
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ship - draw as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    // meteors
    ctx.fillStyle = '#555';
    meteors.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${ship.lives}`, 10, 20);
    ctx.fillText(`Score: ${score}s`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Survived ${score} seconds`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
