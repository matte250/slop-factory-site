// Simple "Cosmic Dodge" arcade game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  // Simple audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Resize to displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Pre‑compute starfield for background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
  }));

  const player = {
    w: 20,
    h: 20,
    x: canvas.width / 2 - 10,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // draw ship as a triangle
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
    },
  };

  const lasers = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;
  let lastAsteroid = 0;
  let difficulty = 1; // increases over time

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') fireLaser();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('click', fireLaser);

  function fireLaser() {
    // ensure audio context is running
    audioCtx.resume();
    lasers.push({
      x: player.x + player.w / 2 - 2,
      y: player.y,
      w: 4,
      h: 10,
      speed: 7,
    });
    // laser fire sound
    playTone(800, 0.08);
  }

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 1 + difficulty * 0.5,
    });
  }

  function updateEntities() {
    // player movement
    if (keys['ArrowLeft']) player.dx = -player.speed;
    else if (keys['ArrowRight']) player.dx = player.speed;
    else player.dx = 0;
    player.update();

    // lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y + l.h < 0) lasers.splice(i, 1);
    }

    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with player
      if (rectCollide(a, player)) {
        // player hit sound
        playTone(200, 0.3);
        gameOver = true;
      }
      // collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        if (rectCollide(a, lasers[j])) {
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          score++;
          break;
        }
      }
      // remove off‑screen
      if (a.y - a.h > canvas.height) asteroids.splice(i, 1);
    }

    // difficulty ramps up every 10 seconds
    if (performance.now() / 1000 % 10 < 0.02) difficulty += 0.2;
  }

  function rectCollide(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background starfield
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#bbb';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player
    player.draw();
    // lasers with glow
    lasers.forEach(l => {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0';
      ctx.fillRect(l.x, l.y, l.w, l.h);
      ctx.restore();
    });
    // asteroids as circles with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2,
        a.x + a.w / 2, a.y + a.h / 2, a.w / 2
      );
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (gameOver) { draw(); return; }
    // spawn asteroids roughly every 1s, faster with difficulty
    if (timestamp - lastAsteroid > 1000 / difficulty) {
      spawnAsteroid();
      lastAsteroid = timestamp;
    }
    updateEntities();
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
