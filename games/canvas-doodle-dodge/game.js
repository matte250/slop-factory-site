// Game based on IDEA.md – Canvas Doodle Dodge
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // ----- Audio -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // unlock audio on user interaction
  window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });

  function beep(freq, duration, volume = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playThrust() { beep(200, 0.05, 0.05); }
  function playStar() { beep(800, 0.07, 0.2); }
  function playExplosion() { beep(100, 0.3, 0.3); }

  // ----- Player -----
  const player = {
    x: width / 2,
    y: height / 2,
    size: 12,
    speed: 3,
    dx: 0,
    dy: 0,
    update() {
      this.x = Math.max(this.size, Math.min(width - this.size, this.x + this.dx));
      this.y = Math.max(this.size, Math.min(height - this.size, this.y + this.dy));
    },
    draw() {
      // ship body
      const grad = ctx.createLinearGradient(this.x - this.size, this.y, this.x + this.size, this.y + this.size);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#080');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
      // thrust when moving forward
      if (this.dy < 0) {
        ctx.fillStyle = '#ff8';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size / 2, this.y + this.size + 6);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size + 6);
        ctx.closePath();
        ctx.fill();
        playThrust();
      }
    }
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {keys[e.key] = true;});
  window.addEventListener('keyup', e => {keys[e.key] = false;});

  function handleInput() {
    player.dx = 0; player.dy = 0;
    if (keys.ArrowUp || keys.w) player.dy = -player.speed;
    if (keys.ArrowDown || keys.s) player.dy = player.speed;
    if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
    if (keys.ArrowRight || keys.d) player.dx = player.speed;
  }

  // ----- Asteroids -----
  const asteroids = [];
  // generate background stars for parallax effect
  const bgStars = [];
  for (let i = 0; i < 200; i++) {
    bgStars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.3
    });
  }
  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 2;
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -20;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (edge === 1) { // bottom
      x = Math.random() * width;
      y = height + 20;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
    } else if (edge === 2) { // left
      x = -20;
      y = Math.random() * height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
    } else { // right
      x = width + 20;
      y = Math.random() * height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
    }
    const radius = 8 + Math.random() * 12;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02;
    asteroids.push({x, y, vx, vy, r: radius, a: angle, rs: rotSpeed});
  }

  // ----- Stars -----
  const stars = [];
  function spawnStar() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 3 + Math.random() * 2;
    stars.push({x, y, r, collected: false});
  }

  // ----- Collision -----
  function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
    // approximate ship as rectangle around its centroid
    const closestX = Math.max(rx - rw/2, Math.min(cx, rx + rw/2));
    const closestY = Math.max(ry - rh/2, Math.min(cy, ry + rh/2));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  // ----- Game Loop -----
  let score = 0;
  let gameOver = false;
  let lastAsteroid = 0;
  let lastStar = 0;

  function update(dt) {
    handleInput();
    player.update();
    // asteroids movement and rotation
    asteroids.forEach(a => {a.x += a.vx; a.y += a.vy; a.a += a.rs;});
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -30 || a.x > width + 30 || a.y < -30 || a.y > height + 30) asteroids.splice(i, 1);
      else if (circleRectCollide(a.x, a.y, a.r, player.x, player.y, player.size, player.size)) {
        gameOver = true;
        playExplosion();
        return;
      }
    }
    // stars collection
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
        if (!s.collected && Math.hypot(s.x - player.x, s.y - player.y) < s.r + player.size) {
          s.collected = true;
          ++score;
          stars.splice(i, 1);
          playStar();
        }
    }
    // spawn logic
    if (performance.now() - lastAsteroid > 1000) {spawnAsteroid(); lastAsteroid = performance.now();}
    if (performance.now() - lastStar > 3000) {spawnStar(); lastStar = performance.now();}
  }

  function draw() {
    ctx.clearRect(0,0,width,height);
    // player
    player.draw();
    // background stars (parallax)
    bgStars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // asteroids with rotation and gradient
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.a);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.3, 0, 0, a.r);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#900');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    // stars (collectibles)
    ctx.fillStyle = '#ff0';
    stars.forEach(s => {if (!s.collected) {ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();}});
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  let lastTS = 0;
  function loop(ts) {
    const dt = ts - lastTS;
    lastTS = ts;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
