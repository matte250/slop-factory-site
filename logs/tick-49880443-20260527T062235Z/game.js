// Asteroid Dodge – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // size canvas (adjust as needed)
  canvas.width = 800;
  canvas.height = 600;

  // starfield for background
  const stars = [];
  const initStars = (count = 100) => {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };
  initStars();

  const player = { x: 50, y: canvas.height / 2, w: 30, h: 20, speed: 5 };
  const asteroids = [];
  let keys = { up: false, down: false };
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  const spawn = () => {
    const size = 20 + Math.random() * 30; // 20‑50px
    const y = Math.random() * (canvas.height - size);
    const speed = 2 + Math.random() * 4; // 2‑6
    asteroids.push({ x: canvas.width, y, w: size, h: size, speed });
  };

  const rectsCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = (dt) => {
    if (keys.up) player.y = Math.max(0, player.y - player.speed);
    if (keys.down) player.y = Math.min(canvas.height - player.h, player.y + player.speed);
    // spawn asteroids every 1.5 s
    if (performance.now() - lastSpawn > 1500) { spawn(); lastSpawn = performance.now(); }
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      else if (rectsCollide(player, a)) gameOver = true;
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background space with moving stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player ship (gradient triangle) with simple thrust effect
    // thrust flicker when moving up or down
    if (keys.up || keys.down) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(player.x - 5, player.y + player.h / 2 - 2, 5, 4);
    }
    const gradShip = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    gradShip.addColorStop(0, '#00ff00');
    gradShip.addColorStop(1, '#006600');
    ctx.fillStyle = gradShip;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h / 2);
    ctx.closePath();
    ctx.fill();
    // asteroids - draw as shaded circles
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#b5651d');
      grad.addColorStop(1, '#4b2e1e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${seconds}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = (timestamp) => {
    if (!gameOver) {
      const dt = timestamp - (lastRender || timestamp);
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
    lastRender = timestamp;
  };
  let lastRender = 0;

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // input handling with sound effects
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      keys.up = true;
      playTone(600, 0.05); // thrust up sound
    }
    if (e.key === 'ArrowDown') {
      keys.down = true;
      playTone(400, 0.05); // thrust down sound
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
  });

  // play explosion sound on game over
  const playExplosion = () => playTone(120, 0.4);

  // modify draw to trigger explosion sound once
  const originalDraw = draw;
  const draw = () => {
    originalDraw();
    if (gameOver && !gameOver.soundPlayed) {
      playExplosion();
      gameOver.soundPlayed = true;
    }
  };

  requestAnimationFrame(loop);
})();
