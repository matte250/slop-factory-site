// Minimal Cosmic Dodge game implementation
// Assumes an HTML canvas element with id="game" is present.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioUnlocked = false;
  const unlockAudio = () => {
    if (audioUnlocked) return;
    // create empty buffer and play to unlock on iOS/Chrome
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    audioUnlocked = true;
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('click', unlockAudio);

  const playTone = (freq, duration) => {
    if (!audioUnlocked) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };

  const W = canvas.width;
  const H = canvas.height;
  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
    });
  }
  function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Ship trail
  const trail = [];
  // Player ship with gradient
  const ship = {
    // draw with a cyan‑to‑blue vertical gradient

    x: 50,
    y: H / 2,
    w: 20,
    h: 20,
    speed: 4,
    dy: 0,

    update() {
      this.y += this.dy;
      // keep inside canvas
      if (this.y - this.h / 2 < 0) this.y = this.h / 2;
      if (this.y + this.h / 2 > H) this.y = H - this.h / 2;
    },
  };

  // Obstacles (asteroids)
  const asteroids = [];
  const asteroidSpeed = 3;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const y = Math.random() * (H - size) + size / 2;
    asteroids.push({ x: W + size, y, w: size, h: size });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      ship.dy = -ship.speed;
      playTone(440, 0.1);
    } else if (e.key === 'ArrowDown') {
      ship.dy = ship.speed;
      playTone(660, 0.1);
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') ship.dy = 0;
  });

  // Score
  let score = 0;
  let startTime = null;
  let gameOver = false;

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function checkCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function gameLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastSpawn || timestamp);
    if (delta > spawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    ctx.clearRect(0, 0, W, H);

    // Update and draw ship
    // Update ship trail
    trail.push({ x: ship.x, y: ship.y });
    if (trail.length > 30) trail.shift();
    // Draw background first
    drawBackground();
    // Draw trail with fading effect
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = i / trail.length;
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ship.w / 2 * (1 - i / trail.length), 0, Math.PI * 2);
      ctx.fill();
    }
    ship.update();
    ship.draw();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      // asteroid gradient fill
    const gradA = ctx.createRadialGradient(a.x, a.y, a.w/4, a.x, a.y, a.w/2);
    gradA.addColorStop(0, '#fff');
    gradA.addColorStop(1, '#555');
    ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.w / 2, 0, Math.PI * 2);
      ctx.fill();

      // Collision
if (checkCollision(ship, { x: a.x - a.w / 2, y: a.y - a.h / 2, w: a.w, h: a.h })) {
          playTone(110, 0.3); // collision sound
          gameOver = true;
        }

      // Remove off‑screen
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }

    // Score based on time survived
    if (!gameOver) score = (timestamp - startTime) / 1000;
    drawScore();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    } else {
      requestAnimationFrame(gameLoop);
    }
  }

  requestAnimationFrame(gameLoop);
})();
