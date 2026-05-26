// Neon Runner – minimal implementation
// Canvas with id="game" must exist in the hosting HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Audio assets
  const bgMusic = new Audio('https://actions.google.com/sounds/v1/ambiences/space_ambient.ogg');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  const collectSound = new Audio('https://actions.google.com/sounds/v1/cartoon/medium_thing.mp3');
  const crashSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
  let audioStarted = false;
  const startAudio = () => {
    if (!audioStarted) {
      bgMusic.play();
      audioStarted = true;
    }
  };
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player (glowing dot)
  const player = {
  trail: [] // recent positions for glow trail
    x: canvas.width / 2,
    y: canvas.height - 60,
    r: 5,
    angle: -Math.PI / 2, // up
    speed: 2,
    turn: 0,
  };

  // Input handling (left / right arrows)
  const keys = {};
  window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true; if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true; startAudio(); });
  window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false; if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false; });

  let obstacles = [];
  let orbs = [];
  let score = 0;
  let slowTimer = 0;
  let gameOver = false;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const addObstacle = () => {
    const w = rand(50, 120);
    const h = 8;
    obstacles.push({
      x: rand(w / 2, canvas.width - w / 2),
      y: -20,
      w,
      h,
      angle: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.07, 0.07),
    });
  };

  const addOrb = () => {
    const radius = 4;
    orbs.push({
      x: rand(radius, canvas.width - radius),
      y: -20,
      r: radius,
    });
  };

  const update = () => {
    if (gameOver) return;
    // player rotation
    if (keys.left) player.turn = -0.04;
    else if (keys.right) player.turn = 0.04;
    else player.turn = 0;
    player.angle += player.turn;
    // move player forward
    const spd = player.speed;
    player.x += Math.cos(player.angle) * spd;
    player.y += Math.sin(player.angle) * spd;

    // keep player inside canvas (wrap)
    if (player.x < 0) player.x += canvas.width;
    if (player.x > canvas.width) player.x -= canvas.width;
    if (player.y < 0) player.y += canvas.height;
    if (player.y > canvas.height) player.y -= canvas.height;

    // update trail – store recent positions with fading alpha
    player.trail.push({x: player.x, y: player.y, alpha: 0.8});
    if (player.trail.length > 12) player.trail.shift();
    // fade older points
    player.trail.forEach(p => { p.alpha *= 0.85; });

    const obstacleSpeed = slowTimer ? spd * 0.4 : spd;
    // update obstacles
    obstacles.forEach(o => {
      o.y += obstacleSpeed;
      o.angle += o.rotSpeed;
    });
    obstacles = obstacles.filter(o => o.y - o.h < canvas.height);
    // spawn obstacles
    if (obstacles.length < 12) addObstacle();

    // update orbs
    orbs.forEach(o => { o.y += obstacleSpeed; });
    orbs = orbs.filter(o => o.y - o.r < canvas.height);
    if (orbs.length < 5 && Math.random() < 0.02) addOrb();

    // collision detection (simple circle‑vs‑circle approximation)
    for (const o of obstacles) {
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < player.r + Math.max(o.w, o.h) / 2) { gameOver = true; crashSound.play(); break; }
    }
    // collect orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      if (Math.hypot(dx, dy) < player.r + o.r) {
        score += 10;
        slowTimer = 180; // ~3 seconds at 60fps
        orbs.splice(i, 1);
        collectSound.currentTime = 0;
        collectSound.play();
      }
    }
    if (slowTimer) slowTimer--;
    score += 0.02; // distance based increment
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw player trail (fading neon)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < player.trail.length; i++) {
      const p = player.trail[i];
      ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, player.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // draw player with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // draw obstacles (rotating bars)
    ctx.fillStyle = '#0ff';
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle);
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    });
    // draw orbs
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
