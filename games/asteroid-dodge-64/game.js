// Minimal Asteroid Dodge game targeting <canvas id="game"></canvas>
// The script creates a scrolling starfield, a controllable ship, asteroids and basic shooting.
// All dimensions are in pixels; the canvas is sized to its CSS width/height.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ----- utilities -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure audio context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });

  function playTone(freq, type = 'sine', duration = 0.1, volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playLaser() { playTone(800, 'square', 0.07, 0.3); }
  function playExplosion() { playTone(150, 'sawtooth', 0.2, 0.5); }
  function playHit() { playTone(300, 'triangle', 0.15, 0.4); }

  // ----- starfield -----
  const stars = Array.from({ length: 120 }, () => ({
    x: rand(0, W), y: rand(0, H), r: rand(0.3, 1.5), s: rand(0.2, 0.8), alpha: rand(0.5, 1)
  }));
  function drawStars() {
    // background gradient for depth
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a2a');
    bg.addColorStop(1, '#000020');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // twinkling stars
    stars.forEach(st => {
      st.x -= st.s;
      if (st.x < 0) { st.x = W; st.y = rand(0, H); }
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${st.alpha})`;
      ctx.fill();
    });
  }

  // ----- ship -----
  const ship = {
    x: 60, y: H / 2, w: 32, h: 22, speed: 4, health: 3,
    draw() {
      // ship body (green hull)
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
      // cockpit window (lighter)
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(this.x + this.w * 0.6, this.y + this.h / 2, this.h * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // ----- bullets -----
  const bullets = [];
  function shoot() {
    bullets.push({ x: ship.x + ship.w, y: ship.y + ship.h / 2 - 2, w: 6, h: 4, speed: 7 });
    playLaser();
  }
  let shootCooldown = 0;

  // ----- asteroids -----
  const asteroids = [];
  let asteroidTimer = 0;
  function spawnAsteroid() {
    const size = rand(20, 50);
    asteroids.push({ x: W + size, y: rand(0, H - size), w: size, h: size, speed: rand(2, 5) });
  }

  // ----- game state -----
  let score = 0;
  let gameOver = false;

  function update() {
    // ship movement
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // shooting
    if ((keys.Space || keys[' ']) && shootCooldown <= 0) { shoot(); shootCooldown = 15; }
    if (shootCooldown > 0) shootCooldown--;

    // update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.speed;
      if (b.x > W) bullets.splice(i, 1);
    }

    // spawn asteroids
    asteroidTimer--;
    if (asteroidTimer <= 0) { spawnAsteroid(); asteroidTimer = Math.max(30, 80 - Math.floor(score / 100)); }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) { asteroids.splice(i, 1); score += 10; }
    }

    // collisions ship-asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
if (rectCollision(ship, a)) {
          ship.health--;
          playHit();
          asteroids.splice(i, 1);
          if (ship.health <= 0) gameOver = true;
        }
    }

    // collisions bullet-asteroid
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      let hit = false;
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (rectCollision(b, a)) {
          hit = true;
          asteroids.splice(j, 1);
          score += 20;
          playExplosion();
          break;
        }
      }
      if (hit) bullets.splice(i, 1);
    }
  }

  function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${ship.health}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2);
    }
  }

  function loop() {
    if (gameOver) { drawStars(); drawUI(); return; }
    drawStars();
    update();
    ship.draw();
    // draw bullets with a glowing effect
    bullets.forEach(b => {
      const grad = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, 0, b.x + b.w / 2, b.y + b.h / 2, b.w);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    // draw asteroids with texture-like gradient
    asteroids.forEach(a => {
      const rad = Math.max(a.w, a.h) / 2;
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, rad * 0.2, a.x + a.w / 2, a.y + a.h / 2, rad);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, a.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    drawUI();
    requestAnimationFrame(loop);
  }

  // start game after short delay to ensure canvas size is known
  setTimeout(loop, 100);
})();
