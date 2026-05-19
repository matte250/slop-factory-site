// Asteroid Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  // Ensure audio context is resumed on first interaction
  function resumeAudio() {
    if (audioCtx.state !== 'running') audioCtx.resume();
  }
  window.addEventListener('keydown', resumeAudio, { once: true });
  canvas.addEventListener('mousemove', resumeAudio, { once: true });
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  const ship = { w: 30, h: 20, x: W / 2, y: H - 30, speed: 6 };
  const keys = {};
  const asteroids = [];
  const stars = Array.from({length: 80}, () => ({ x: Math.random() * W, y: Math.random() * H }));
  let score = 0;
  let gameOver = false;
  let spawnTimer = 0;
  let spawnInterval = 90; // frames

  // Input handlers
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (W - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + score / 2000; // increase speed over time
    const angle = Math.random() * Math.PI * 2;
    const spin = (Math.random() - 0.5) * 0.05; // rotation per frame
    asteroids.push({ x, y: -radius, r: radius, speed, angle, spin });
    // spawn sound
    beep(300, 80);
  }


  function update() {
    // move stars background
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    });
    if (gameOver) return;
    // move ship
    if (keys['ArrowLeft'] && ship.x - ship.w / 2 > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w / 2 < W) ship.x += ship.speed;

    // spawn asteroids
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnAsteroid();
      spawnTimer = 0;
      // gradually increase difficulty
      if (spawnInterval > 30) spawnInterval -= 1;
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
        a.y += a.speed;
        a.angle += a.spin; // rotate over time
      // collision with ship (simple AABB vs circle)
      const left = ship.x - ship.w / 2;
      const right = ship.x + ship.w / 2;
      const top = ship.y;
      const bottom = ship.y + ship.h;
      const distX = Math.abs(a.x - ship.x);
      const distY = Math.abs(a.y - ship.y);
      if (distX <= ship.w / 2 + a.r && distY <= ship.h / 2 + a.r) {
        // precise circle-rect check
        const dx = Math.max(left - a.x, 0, a.x - right);
        const dy = Math.max(top - a.y, 0, a.y - bottom);
if (dx * dx + dy * dy <= a.r * a.r) {
            beep(100, 300);
            gameOver = true;
          }
      }
      // remove off‑screen
      if (a.y - a.r > H) {
          // score sound
          beep(200, 80);
          score += 10;
          asteroids.splice(i, 1);
          continue;
        }
        asteroids.splice(i, 1);
        score += 10;
      }
    }
  }

  function draw() {
    ctx.fillStyle = ctx.createLinearGradient(0, 0, 0, H);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
      // draw stars background
      ctx.fillStyle = '#fff';
      stars.forEach(s => { ctx.fillRect(s.x, s.y, 1, 1); });
      // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids
    ctx.fillStyle = '#aaa';
    asteroids.forEach(a => {
      // rotate asteroid
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 30);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
