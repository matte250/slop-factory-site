// Minimal endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // ---- Audio setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInit = false;
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const W = (canvas.width = canvas.width || 800);
  const H = (canvas.height = canvas.height || 200);

  // --------- Config ---------
  const GRAVITY = 0.6;
  const JUMP_V = -12;
  const PLAYER_W = 20;
  const PLAYER_H = 30;
  const SLIDE_H = 15;
  const OBSTACLE_W = 20;
  const OBSTACLE_H = 30;
  const STAR_SIZE = 10;
  const SPEED = 3;
  const SPAWN_INTERVAL = 1500; // ms

  // --------- State ----------
  let score = 0;
  let gameOver = false;
  const player = {
    x: 50,
    y: H - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    onGround: true,
    sliding: false,
    slideTimer: 0,
  };
  const obstacles = [];
  const stars = [];

  // ---------- Input ---------
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') jump();
    if (e.key === 'ArrowDown') slide();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function jump() {
    if (player.onGround && !player.sliding) {
      if (!audioInit) {audioCtx.resume(); audioInit = true;}
      beep(440, 0.1); // jump sound
      player.vy = JUMP_V;
      player.onGround = false;
    }
  }

  function slide() {
    if (player.onGround && !player.sliding) {
      if (!audioInit) {audioCtx.resume(); audioInit = true;}
      beep(300, 0.07); // slide sound
      player.sliding = true;
      player.h = SLIDE_H;
      player.y = H - player.h;
      player.slideTimer = 20; // frames
    }
  }

  // --------- Helpers --------
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnObstacle() {
    const height = OBSTACLE_H;
    obstacles.push({ x: W, y: H - height, w: OBSTACLE_W, h: height });
  }

  function spawnStar() {
    const size = STAR_SIZE;
    const y = H - PLAYER_H - 40 - Math.random() * 60; // somewhere above ground
    stars.push({ x: W, y, w: size, h: size, collected: false });
  }

  // --------- Game Loop -------
  let lastSpawn = 0;
  function update(delta) {
    if (gameOver) return;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // slide timer
    if (player.sliding) {
      player.slideTimer--;
      if (player.slideTimer <= 0) {
        player.sliding = false;
        player.h = PLAYER_H;
        player.y = H - player.h;
      }
    }

    // move obstacles and stars
    obstacles.forEach(o => (o.x -= SPEED));
    stars.forEach(s => (s.x -= SPEED));

    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (stars.length && stars[0].x + stars[0].w < 0) stars.shift();

    // collisions
    for (const o of obstacles) {
      if (rectIntersect(player, o)) {
        gameOver = true;
        break;
      }
    }
    for (const s of stars) {
      if (!s.collected && rectIntersect(player, s)) {
        beep(600, 0.05); // star collect sound
        s.collected = true;
        score += 10;
      }
    }

    // spawn logic
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      if (Math.random() < 0.7) spawnObstacle();
      else spawnStar();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, '#1a2a3a');
    bgGrad.addColorStop(1, '#274059');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, H - 5, W, 5);
    // player (pixel character)
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 4, player.y + 5, 3, 3);
    ctx.fillRect(player.x + player.w - 7, player.y + 5, 3, 3);
    // obstacles (spiky)
    ctx.fillStyle = '#b00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // stars (twinkling)
    stars.forEach(s => {
      if (s.collected) return;
      ctx.save();
      ctx.translate(s.x + s.w/2, s.y + s.h/2);
      ctx.rotate(performance.now() / 1000);
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(0, s.w/2);
        ctx.rotate(Math.PI / 5);
        ctx.lineTo(0, s.w/4);
        ctx.rotate(Math.PI / 5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  let lastTime = 0;
  function loop(ts) {
    const delta = ts - lastTime;
    lastTime = ts;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
