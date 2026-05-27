// Simple asteroid‑escape game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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
  }
  canvas.width = 400;
  canvas.height = 600;

  // generate simple starfield background
  const stars = [];
  const starCount = 50;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5
    });
  }

  const player = { w: 30, h: 30, x: canvas.width / 2 - 15, y: canvas.height - 40, speed: 5 };
  const keys = { left: false, right: false };
  const asteroids = [];
  let lastSpawn = 0;
  let spawnInterval = 1500; // ms
  let startTime = null;
  let animationId = null;
  let gameOver = false;
  let score = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x, y: -radius, radius, speed });
    // play brief rise tone for new asteroid
    playTone(400, 0.07);
  }

  function update(dt) {
    // move player
    if (keys.left) player.x = Math.max(0, player.x - player.speed);
    if (keys.right) player.x = Math.min(canvas.width - player.w, player.x + player.speed);

    // spawn asteroids
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
      // gradually increase difficulty
      spawnInterval = Math.max(400, spawnInterval - 20);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with player
      if (a.y + a.radius >= player.y &&
          a.x + a.radius > player.x &&
          a.x - a.radius < player.x + player.w) {
        // collision sound
        playTone(150, 0.3);
        gameOver = true;
      }
      // remove off‑screen
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        score++;
      }
    }
  }

  function draw() {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // player ship (triangle with gradient)
    const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    shipGrad.addColorStop(0, '#ff0');
    shipGrad.addColorStop(1, '#fa0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    // asteroids with simple shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // score / time
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s  Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Survived ${elapsed}s`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const dt = timestamp - (animationId?.last || timestamp);
    if (!gameOver) {
      update(dt);
      draw();
      animationId = requestAnimationFrame(loop);
    } else {
      draw(); // final frame
    }
  }

  animationId = requestAnimationFrame(loop);
})();
