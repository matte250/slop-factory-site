// Asteroid Dodge Game
// Assumes a <canvas id="game"></canvas> exists in the page.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioStarted = false;
  const startAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  // Simple tone player
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
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions (fallback to 800x600)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  };

  const asteroids = [];
  const stars = [];
  let score = 0;
  let frames = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; startAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + frames / 2000; // gradually increase
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function spawnStar() {
    const size = 5;
    const x = Math.random() * (canvas.width - size);
    const speed = 1 + frames / 3000;
    stars.push({ x, y: -size, size, speed });
  }

  function update() {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    else if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x + ship.dx));

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        score += 10;
        // asteroid passed safely - subtle beep
        playSound(300, 0.08);
      } else if (
        a.x + a.radius > ship.x &&
        a.x - a.radius < ship.x + ship.width &&
        a.y + a.radius > ship.y &&
        a.y - a.radius < ship.y + ship.height
      ) {
        gameOver = true;
        // collision - crash sound
        playSound(150, 0.3);
      }
    }

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y - s.size > canvas.height) {
        stars.splice(i, 1);
      } else if (
        s.x + s.size > ship.x &&
        s.x - s.size < ship.x + ship.width &&
        s.y + s.size > ship.y &&
        s.y - s.size < ship.y + ship.height
      ) {
        stars.splice(i, 1);
        score += 5;
        // star collected - chime
        playSound(600, 0.1);
      }
    }

    // Spawn new asteroids / stars
    if (frames % 90 === 0) spawnAsteroid();
    if (frames % 150 === 0) spawnStar();
    frames++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#334');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ship
    ship.draw();
    // Draw asteroids with radial shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw stars with glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff0';
    ctx.fillStyle = '#ff0';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // draw final state
    }
  }

  // Start the game
  requestAnimationFrame(loop);
})();
