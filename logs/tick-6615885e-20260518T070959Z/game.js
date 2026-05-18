// Game implementation based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const ship = { x: width / 2, y: height - 50, r: 15, speed: 3, fuel: 100 };
  let score = 0;
  let highScore = Number(localStorage.getItem('highScore') || 0);

  const nuggets = [];
  const asteroids = [];
  const stars = [];
  let frames = 0;
  let gameOver = false;

  function spawnNugget() {
    nuggets.push({ x: Math.random() * width, y: -10, r: 8, vy: 1 + Math.random() * 2 });
  }
  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * width, y: -size, r: size, vy: 2 + Math.random() * 2 });
  }

  function spawnStar() {
    // small white dot moving slowly
    stars.push({ x: Math.random() * width, y: -2, vy: 0.5 + Math.random() * 0.5 });
  }

  function update() {
    if (gameOver) return;
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep within bounds
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y));
    // fuel consumption
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) endGame();
    // spawn objects
    if (frames % 120 === 0) spawnNugget();
    if (frames % 180 === 0) spawnAsteroid();
    if (frames % 30 === 0) spawnStar(); // background stars
    // update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.vy;
      if (s.y > height) { stars.splice(i, 1); }
    }
    // update nuggets
    for (let i = nuggets.length - 1; i >= 0; i--) {
      const n = nuggets[i];
      n.y += n.vy;
      if (n.y - n.r > height) { nuggets.splice(i, 1); continue; }
      if (dist(n, ship) < n.r + ship.r) {
        score++;
        ship.fuel = Math.min(100, ship.fuel + 5);
        playTone(880, 0.15);
        nuggets.splice(i, 1);
      }
    }
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      if (a.y - a.r > height) { asteroids.splice(i, 1); continue; }
      if (dist(a, ship) < a.r + ship.r) {
        endGame();
        return;
      }
    }
    frames++;
  }

function draw() {
    ctx.clearRect(0, 0, width, height);
    // background with starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = '#444';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    // ship (draw as triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // nuggets with gradient
    nuggets.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, 'yellow');
      grad.addColorStop(1, 'orange');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids (irregular polygons)
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 / points) * i;
        const rad = a.r * (0.7 + Math.random() * 0.6);
        const x = a.x + Math.cos(angle) * rad;
        const y = a.y + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 40);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}%`, 10, 60);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
    // ship (draw as triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // nuggets with gradient
    nuggets.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, 'yellow');
      grad.addColorStop(1, 'orange');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids (irregular)
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 / points) * i;
        const rad = a.r * (0.7 + Math.random() * 0.6);
        const x = a.x + Math.cos(angle) * rad;
        const y = a.y + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2);
    ctx.fill();
    // nuggets
    ctx.fillStyle = 'gold';
    nuggets.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 40);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}%`, 10, 60);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function endGame() {
    // play crash sound
    playTone(220, 0.5);
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
    }
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // start loop
  requestAnimationFrame(loop);
})();
