// Astro Dodge – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Unlock audio on first interaction
  const unlockAudio = () => { audioCtx.resume(); window.removeEventListener('click', unlockAudio); window.removeEventListener('keydown', unlockAudio); };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  function playTone(freq, duration) {
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
  // Simple background hum
  const bgInterval = setInterval(() => playTone(40, 0.5), 4000);


  // Player ship
  const ship = { w: 30, h: 15, x: width / 2 - 15, y: height - 20, speed: 5 };

  // Asteroids
  const asteroids = [];
  // Star field for background
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }
  let spawnTimer = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, v: 1 + Math.random() * 2 });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys['ArrowRight']) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // Update stars for parallax background
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Spawn asteroids
    spawnTimer--;
    if (spawnTimer <= 0) { 
      spawnAsteroid(); 
      playTone(300, 0.08); // spawn sound
      spawnTimer = Math.max(30, 120 - score * 2); 
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.v;
      a.v += 0.02; // accelerate
      // Remove off‑screen
      if (a.y > height) { asteroids.splice(i, 1); score++; }
      // Collision
      else if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        gameOver = true;
        playTone(100, 0.3); // collision sound
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids as circles with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
