// Minimal game based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set size (you may adjust via CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  }

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  // Ensure audio context runs after user interaction
  let audioStarted = false;
  function initAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audioStarted = true;
  }
  window.addEventListener('keydown', e=>{ if(!audioStarted) initAudio(); });
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const ship = { x: canvas.width / 2, y: canvas.height - 60, r: 20, speed: 4 };
  const stars = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;
  let frame = 0;

  const rand = (min, max) => Math.random() * (max - min) + min;

  function spawnStar() {
    stars.push({ x: rand(0, canvas.width), y: -10, r: 5, speed: 2 });
  }
  function spawnAsteroid() {
    const size = rand(15, 40);
    const angle = rand(0, Math.PI * 2);
    const rotSpeed = rand(-0.05, 0.05);
    asteroids.push({ x: rand(0, canvas.width - size), y: -size, w: size, h: size, speed: rand(2, 5), angle, rotSpeed });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y));

    // Spawn entities
    if (frame % 30 === 0) spawnStar(); // every half second at 60fps
    if (frame % 90 === 0) spawnAsteroid(); // every 1.5 seconds

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      // collision with ship
      const dx = s.x - ship.x;
      const dy = s.y - ship.y;
      if (Math.hypot(dx, dy) < s.r + ship.r) {
        score++;
        // Play collection sound (higher pitch)
        playBeep(800, 0.1);
        stars.splice(i, 1);
        continue;
      }
      // remove offscreen
      if (s.y - s.r > canvas.height) stars.splice(i, 1);
    }

    // Update asteroids with rotation
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // update rotation angle
      a.angle = (a.angle || 0) + (a.rotSpeed || 0);
      // simple AABB vs circle collision
      const nearestX = Math.max(a.x, Math.min(ship.x, a.x + a.w));
      const nearestY = Math.max(a.y, Math.min(ship.y, a.y + a.h));
      const dx = ship.x - nearestX;
      const dy = ship.y - nearestY;
      if (Math.hypot(dx, dy) < ship.r) {
        // Play crash sound (low pitch)
        playBeep(200, 0.5);
        gameOver = true;
        break;
      }
      if (a.y - a.h > canvas.height) asteroids.splice(i, 1);
    }
    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
// Stars (background) with gradient and glow
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw stars with soft glow and twinkle
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'yellow';
  stars.forEach(s => {
    // twinkle by varying opacity slightly
    const opacity = 0.7 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(255,255,0,${opacity})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  // Asteroids with radial gradient and rotation
  asteroids.forEach(a => {
    const cx = a.x + a.w / 2;
    const cy = a.y + a.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a.angle || 0);
    const grad = ctx.createRadialGradient(
      0,
      0,
      a.w * 0.1,
      0,
      0,
      a.w / 2
    );
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.fillRect(-a.w / 2, -a.h / 2, a.w, a.h);
    ctx.restore();
  });
    // Ship (gradient triangle with slight glow)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.r, ship.x, ship.y + ship.r);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = shipGrad;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '30px sans-serif';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
