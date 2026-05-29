// Minimal Asteroid Dodge game with improved graphics
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  // create a starfield background
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.2,
    });
  }
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  const player = { w: 30, h: 30, x: canvas.width / 2 - 15, y: canvas.height - 40, speed: 4 };
  const keys = { left: false, right: false };
  const asteroids = [];
  let lastSpawn = 0;
  let spawnInterval = 1500; // ms
  let speedInc = 0.02; // per second
  let asteroidSpeed = 2;
  let startTime = performance.now();
  let gameOver = false;

  const drawPlayer = () => {
    // draw triangular spaceship
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
  };

  const drawAsteroid = (a) => {
    // asteroid with radial gradient
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  };

  const spawnAsteroid = () => {
    const r = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - 2 * r) + r;
    asteroids.push({ x, y: -r, r, speed: asteroidSpeed });
  };

  const update = (dt) => {
    if (gameOver) return;
    // move player
    if (keys.left) player.x = Math.max(0, player.x - player.speed);
    if (keys.right) player.x = Math.min(canvas.width - player.w, player.x + player.speed);

    // update starfield
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y - s.r > canvas.height) {
        s.y = -s.r;
        s.x = Math.random() * canvas.width;
      }
    });

    // spawn
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision (circle-rect)
      const cx = Math.max(a.x, Math.min(player.x + player.w / 2, a.x + a.r));
      const cy = Math.max(a.y, Math.min(player.y + player.h / 2, a.y + a.r));
      const dist = Math.hypot(cx - a.x, cy - a.y);
      if (dist < a.r) {
        // collision sound
        playBeep(150, 0.3);
        gameOver = true;
        break;
      }
      // remove off‑screen
      if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
    }

    // ramp difficulty
    const elapsed = (performance.now() - startTime) / 1000;
    asteroidSpeed = 2 + elapsed * speedInc;
    spawnInterval = Math.max(300, 1500 - elapsed * 20);
  };

  const render = () => {
    // black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw moving starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    drawPlayer();
    asteroids.forEach(drawAsteroid);
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const score = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${score}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`Survived ${score}s`, canvas.width / 2, canvas.height / 2 + 20);
    }
  };

  let lastTime = 0;
  const loop = (ts) => {
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // input handling
  window.addEventListener('keydown', (e) => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      keys.left = true;
      playBeep(440, 0.05); // move sound
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      keys.right = true;
      playBeep(440, 0.05);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  requestAnimationFrame(loop);
})();
