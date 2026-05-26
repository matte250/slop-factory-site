// Neon Runner – simple endless runner on a canvas with id "game"
// Player: glowing ship (square). Controls: Arrow keys / WASD.
// Obstacles: moving vertical bars with a gap, scrolling left.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player definition
  const player = {
    // Shape will be drawn as a triangle ship
    // dimensions are for collision box
    w: 30,
    h: 30,
    x: 80,
    y: canvas.height / 2 - 15,
    speed: 4,
    color: '#0ff', // neon cyan
  };
  // Starfield setup
  const stars = [];
  const initStars = (count = 100) => {
    // initialize starfield positions
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  };
  const playCollisionSound = () => playBeep(200, 0.2);
  // optional background hum
  const backgroundHum = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 50;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    // keep running; stop when game ends
    return () => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    };
  };
  const stopHum = backgroundHum();
  initStars();
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };


  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacle definition – vertical bar with a gap
  const obstacles = [];
  const obstacleSpacing = 200; // distance between obstacles
  const obstacleWidth = 40;
  const gapHeight = 150;
  let obstacleTimer = 0;

  let gameOver = false;

  const update = () => {
    if (gameOver) return;
    // Move player based on input
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;

    // Keep player within canvas vertically (falling off ends game)
    if (player.y < 0 || player.y + player.h > canvas.height) {
      endGame();
    }

    // Generate obstacles
    obstacleTimer += 1;
    if (obstacleTimer * 2 > obstacleSpacing) {
      obstacleTimer = 0;
      const gapY = Math.random() * (canvas.height - gapHeight);
      obstacles.push({
        x: canvas.width,
        gapY,
        passed: false,
      });
    }

    // Move obstacles leftward
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5; // tunnel speed
      // Collision detection – player vs upper and lower parts
      const upperRect = { x: o.x, y: 0, w: obstacleWidth, h: o.gapY };
      const lowerRect = { x: o.x, y: o.gapY + gapHeight, w: obstacleWidth, h: canvas.height - (o.gapY + gapHeight) };
      if (rectIntersect(player, upperRect) || rectIntersect(player, lowerRect)) {
        endGame();
      }
      // Remove off‑screen obstacles
      if (o.x + obstacleWidth < 0) obstacles.splice(i, 1);
    }

    // Update starfield for parallax motion
    for (let s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
  };

  const draw = () => {
    // Draw neon gradient background and starfield
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001');
    gradient.addColorStop(1, '#020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw player as neon triangle ship with glow
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw obstacles with neon glow
    ctx.fillStyle = '#f0f'; // neon magenta
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, 0, obstacleWidth, o.gapY);
      ctx.fillRect(o.x, o.gapY + gapHeight, obstacleWidth, canvas.height - (o.gapY + gapHeight));
    });
    ctx.shadowBlur = 0;
  };

  const loop = () => {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      // Display Game Over
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const rectIntersect = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const endGame = () => {
    gameOver = true;
  };

  // Start loop
  requestAnimationFrame(loop);
})();
