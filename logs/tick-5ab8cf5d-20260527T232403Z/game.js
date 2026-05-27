// Simple Space Junk Collector game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Ensure audio context resumes on first interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  // Ship
  const ship = { x: canvas.width / 2, y: canvas.height - 60, w: 30, h: 30, speed: 4 };

  // Game objects
  const junk = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnJunk() {
    const size = 15;
    junk.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
    });
  }

  function spawnAsteroid() {
    const r = 20 + Math.random() * 15;
    asteroids.push({
      x: Math.random() * (canvas.width - 2 * r) + r,
      y: -r,
      r,
      speed: 1.5 + Math.random() * 1.5,
    });
  }

  function update() {
    // Move stars
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Update junk
    junk.forEach((j, i) => {
      j.y += j.speed;
      // Collision with ship
      if (j.x < ship.x + ship.w && j.x + j.w > ship.x && j.y < ship.y + ship.h && j.y + j.h > ship.y) {
        score += 10;
        playTone(440, 0.1); // beep on collect
        junk.splice(i, 1);
      } else if (j.y > canvas.height) {
        junk.splice(i, 1);
      }
    });

    // Update asteroids
    asteroids.forEach((a, i) => {
      a.y += a.speed;
      // Collision with ship (simple circle-rect)
      const distX = Math.abs(a.x - (ship.x + ship.w / 2));
      const distY = Math.abs(a.y - (ship.y + ship.h / 2));
      if (distX <= ship.w / 2 + a.r && distY <= ship.h / 2 + a.r) {
        gameOver = true;
      } else if (a.y - a.r > canvas.height) {
        asteroids.splice(i, 1);
      }
    });

    // Random spawns
    if (Math.random() < 0.02) spawnJunk();
    if (Math.random() < 0.005) spawnAsteroid();
  }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Stars background
    ctx.fillStyle = '#888';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (draw as triangle)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Junk (draw as small circles)
    ctx.fillStyle = '#ff0';
    junk.forEach(j => {
      ctx.beginPath();
      ctx.arc(j.x + j.w / 2, j.y + j.h / 2, j.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
