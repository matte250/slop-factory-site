// Simple side‑scrolling game based on IDEA.md
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur);
  };
  // Player (rocket)
  const player = { x: 80, y: H / 2, w: 30, h: 30, vy: 0 };
  const GRAVITY = 0.4;
  const THRUST = -8;

  // Obstacles (asteroids)
  const asteroids = [];
  const AST_SPEED = 3;
  const AST_FREQ = 1500; // ms

  // Stars (points)
  const stars = [];
  const STAR_SPEED = AST_SPEED;
  const STAR_FREQ = 800; // ms

  let score = 0;
  let lastAst = 0;
  let lastStar = 0;
  let alive = true;

  function thrust() {
    // resume audio context on first interaction
    audioCtx.resume && audioCtx.resume();
    player.vy = THRUST;
    playTone(440, 0.1); // thrust sound
  }
  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: W, y: Math.random() * (H - size), w: size, h: size });
  }

  function spawnStar() {
    const size = 10;
    stars.push({ x: W, y: Math.random() * (H - size), w: size, h: size });
  }

  function update(dt) {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h > H) { player.y = H - player.h; player.vy = 0; }
    if (player.y < 0) { player.y = 0; player.vy = 0; }

    // obstacles
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= AST_SPEED;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      // collision
      if (a.x < player.x + player.w && a.x + a.w > player.x && a.y < player.y + player.h && a.y + a.h > player.y) {
        alive = false;
        playTone(200, 0.5); // crash sound
      }
    }

    // stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= STAR_SPEED;
      if (s.x + s.w < 0) stars.splice(i, 1);
      // collect
      if (s.x < player.x + player.w && s.x + s.w > player.x && s.y < player.y + player.h && s.y + s.h > player.y) {
        score++;
        stars.splice(i, 1);
      }
    }

    const now = Date.now();
    if (now - lastAst > AST_FREQ) { spawnAsteroid(); lastAst = now; }
    if (now - lastStar > STAR_FREQ) { spawnStar(); lastStar = now; }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // player (rocket) - draw as triangle
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // asteroids - draw as gray circles
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // stars
    ctx.fillStyle = '#ffd700';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.w, s.h));
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  let last = performance.now();
  function loop(ts) {
    const dt = ts - last;
    last = ts;
    if (alive) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
