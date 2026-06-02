// Simple arcade game based on IDEA.md
// Canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  // Canvas size and resize handling
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }
  window.addEventListener('resize', resize);
  resize();

  // Starfield background
  let stars = [];
  const starCount = 100;
  function initStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  }
  function drawStars() {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Ship (triangle)
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      ctx.save();
      ctx.fillStyle = '#0af';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      this.x += this.dx;
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    },
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    ship.dx = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
  }

  // Debris
  const debris = [];
  const debrisSize = 20;
  const spawnInterval = 1000;
  let lastSpawn = 0;

  function spawnDebris() {
    const x = Math.random() * (canvas.width - debrisSize);
    debris.push({ x, y: -debrisSize, size: debrisSize, speed: 2 + Math.random() * 3 });
  }

  function updateDebris() {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed;
      if (d.y > canvas.height) debris.splice(i, 1);
    }
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnDebris();
      lastSpawn = Date.now();
    }
  }

  function drawDebris() {
    ctx.fillStyle = '#888';
    debris.forEach(d => ctx.fillRect(d.x, d.y, d.size, d.size));
  }

  // Collision detection
  function checkCollision() {
    return debris.some(d =>
      ship.x < d.x + d.size &&
      ship.x + ship.width > d.x &&
      ship.y < d.y + d.size &&
      ship.y + ship.height > d.y
    );
  }

  // Score
  const startTime = Date.now();
  let gameOver = false;

  function drawScore() {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${seconds}s`, 10, 30);
  }

  // Main loop
  function loop() {
    if (gameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();

    handleInput();
    ship.update();
    ship.draw();

    updateDebris();
    drawDebris();

    drawScore();

    if (checkCollision()) {
      playTone(200, 0.2); // collision sound
      gameOver = true;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
