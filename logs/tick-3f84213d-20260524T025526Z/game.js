// Asteroid Escape game – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // full‑window canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * 0.5 + 0.5
    });
  }

  // player ship (triangle)
  const player = { x: canvas.width / 2, y: canvas.height * 0.85, size: 20, speed: 4, boost: 2 };
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };

  // asteroids
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  const onKey = (e, down) => {
    if (e.key in keys) {
      keys[e.key] = down;
      // play boost sound on ArrowUp press
      if (e.key === 'ArrowUp' && down) {
        playTone(500, 0.1);
      }
      e.preventDefault();
    }
  };
  window.addEventListener('keydown', e => {
    // initialize audio context on first interaction
    if (!audioCtx) initAudio();
    onKey(e, true);
  });
  window.addEventListener('keyup', e => onKey(e, false));

  let audioCtx;
  function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, duration) {
    if (!audioCtx) return;
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

  const spawnAsteroid = () => {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -radius, radius, speed });
  };

  const update = (delta) => {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    if (keys.ArrowUp) player.y -= player.boost;
    // spawn asteroids
    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnAsteroid();
    }
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        score++;
      }
    }
    // collision detection (circle vs circle approximation)
    const px = player.x, py = player.y, pr = player.size;
    for (const a of asteroids) {
      const dx = a.x - px;
      const dy = a.y - py;
      const dist = Math.hypot(dx, dy);
        if (dist < pr + a.radius) {
          // play collision sound
          playTone(200, 0.3);
          gameOver = true;
          break;
        }
      }
    }
  };


  const draw = () => {
    // clear with dark space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // player ship – sleek white triangle with slight glow
    ctx.save();
    ctx.fillStyle = '#00ffcc';
    ctx.strokeStyle = '#00ff99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size, player.y + player.size);
    ctx.lineTo(player.x + player.size, player.y + player.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // asteroids – radial gradient for depth
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#b5651d');
      grad.addColorStop(1, '#331c00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  };

  const loop = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
