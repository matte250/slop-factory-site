// Simple canvas game: Space Debris Dodge
// HTML must contain <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player (triangle ship)
  const player = {
    x: width / 2,
    y: height - 30,
    width: 20,
    height: 30,
    speed: 5,
    dx: 0,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const asteroids = [];
  const stars = [];
  let lastAsteroid = 0;
  let lastStar = 0;
  let score = 0;
  let startTime = null;
  const duration = 60 * 1000; // 60 sec
  let gameOver = false;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });

  function spawnAsteroid() {
    const size = 15 + Math.random() * 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size,
      speed: 2 + Math.random() * 3,
    });
  }

  function spawnStar() {
    const size = 8;
    stars.push({
      x: Math.random() * (width - size),
      y: -size,
      r: size,
      speed: 1 + Math.random() * 1.5,
    });
  }

  function update(dt) {
    // player movement
    player.dx = 0;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x > width) player.x = width;

    // spawn logic
    if (performance.now() - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = performance.now(); }
    if (performance.now() - lastStar > 1500) { spawnStar(); lastStar = performance.now(); }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with player (approximate rectangle vs circle)
      const px = player.x;
      const py = player.y - player.height / 2;
if (a.x + a.r > px - player.width / 2 && a.x - a.r < px + player.width / 2 && a.y + a.r > py - player.height / 2 && a.y - a.r < py + player.height / 2) {
          gameOver = true;
          // play collision sound
          playTone(200, 0.3);
        }
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      // collect
      const dx = s.x - player.x;
      const dy = s.y - player.y;
if (Math.hypot(dx, dy) < s.r + player.width / 2) {
          score++;
          // play collect sound
          playTone(800, 0.1);
          stars.splice(i, 1);
          continue;
        }
      if (s.y - s.r > height) stars.splice(i, 1);
    }
  }

  function draw() {
    // space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw player ship with gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;
    const shipGrad = ctx.createLinearGradient(0, player.y - player.height / 2, 0, player.y + player.height / 2);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // stars with twinkling opacity
    stars.forEach(s => {
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    const timeLeft = Math.max(0, Math.round((duration - (performance.now() - startTime)) / 1000));
    ctx.fillText(`Time: ${timeLeft}s`, width - 100, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 40);
    }
  }

function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    if (!gameOver && elapsed < duration) {
      update(elapsed);
    } else {
      gameOver = true;
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
