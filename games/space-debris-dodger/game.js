// Space Debris Dodger – minimal implementation
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollision() { beep(300, 0.1); }
  function playGameOver() { beep(100, 0.5); }
  function startBgMusic() {
    setInterval(() => { beep(150, 0.05); }, 4000);
  }

  // Game config
  const ship = { w: 40, h: 20, x: 0, y: 0, speed: 4 };
  const debrisSize = 30;
  const debrisSpawnInterval = 1500; // ms
  const maxLives = 3;

  let debris = [];
  // Starfield for background
  const stars = [];
  let bgGradient;
  let left = false,
    right = false;
    let bgStarted = false;
  let lastSpawn = 0;
  let score = 0;
  let lives = maxLives;
  let gameOver = false;
  let startTime = performance.now();

  function init() {
    // Initialize background gradient
    bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#001');
    bgGradient.addColorStop(1, '#000');
    // create starfield with twinkle alpha
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        alpha: Math.random(),
      });
    }
    ship.x = (canvas.width - ship.w) / 2;
    ship.y = canvas.height - ship.h - 10;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    // Ensure audio context is running on first interaction
    if (audioCtx.state !== 'running') {
      audioCtx.resume();
      if (!bgStarted) {
        startBgMusic();
        bgStarted = true;
      }
    }
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  }

  function spawnDebris() {
    const x = Math.random() * (canvas.width - debrisSize);
    const speed = 2 + score / 1000; // slowly increase
    const angle = 0;
    const rotSpeed = (Math.random() - 0.5) * 0.1; // rotation per frame
    const hue = Math.random() * 60 + 200; // bluish hues
    debris.push({ x, y: -debrisSize, w: debrisSize, h: debrisSize, speed, angle, rotSpeed, hue });
  }

  function update(dt) {
    // rotate debris
    debris.forEach(d => {
      d.angle += d.rotSpeed;
    });
    // move stars for parallax effect and twinkle
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      // twinkle alpha oscillation
      s.alpha += (Math.random() - 0.5) * 0.02;
      if (s.alpha < 0.2) s.alpha = 0.2;
      if (s.alpha > 1) s.alpha = 1;
    }

    // Move ship
    if (left) ship.x = Math.max(0, ship.x - ship.speed);
    if (right) ship.x = Math.min(canvas.width - ship.w, ship.x + ship.speed);

    // Spawn debris
    if (performance.now() - lastSpawn > debrisSpawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // Update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed;
      // Remove off‑screen
      if (d.y > canvas.height) {
        debris.splice(i, 1);
        continue;
      }
      // Collision
      if (
        d.x < ship.x + ship.w &&
        d.x + d.w > ship.x &&
        d.y < ship.y + ship.h &&
        d.y + d.h > ship.y
      ) {
        debris.splice(i, 1);
        lives--;
        playCollision();
        if (lives <= 0) {
          gameOver = true;
          playGameOver();
        }
      }
    }

    // Update score
    score = Math.floor((performance.now() - startTime) / 10);
  }

  function draw() {
ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Starfield background
    // Background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars with twinkle alpha
    stars.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Ship – triangle with stroke
    ctx.fillStyle = '#0af';
    ctx.strokeStyle = '#003';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Debris – draw rotated with color hue
    debris.forEach(d => {
      ctx.save();
      ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
      ctx.rotate(d.angle);
      ctx.fillStyle = `hsl(${d.hue},70%,50%)`;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    });
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Lives: ' + lives, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastFrame || timestamp);
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
    lastFrame = timestamp;
  }

  let lastFrame = 0;
  init();
})();
