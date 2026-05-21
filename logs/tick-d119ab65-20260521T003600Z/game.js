// Space Dodger – minimal canvas game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const backgroundMusic = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/sine.mp3'); // placeholder loop tone
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.05;
  backgroundMusic.play();
  const thrustSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/impact.wav');
  thrustSound.volume = 0.2;
  const explosionSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/boom.wav');
  explosionSound.volume = 0.4;
  const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
  window.addEventListener('resize', resize);
  resize();

  // Player ship
  const ship = { x: canvas.width / 2, y: canvas.height * 0.8, w: 20, h: 30, speed: 4 };
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // start background music on first interaction
    if (backgroundMusic.paused) backgroundMusic.play();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles (asteroids)
  const obstacles = [];
  let spawnTimer = 0;
  const particles = []; // exhaust particles
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  const update = dt => {
    // Input – arrow keys or WASD
    const moved = (keys.ArrowLeft || keys.a || keys.ArrowRight || keys.d || keys.ArrowUp || keys.w || keys.ArrowDown || keys.s);
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Exhaust particles when moving
    if (moved) {
      particles.push({
        x: ship.x + ship.w / 2,
        y: ship.y + ship.h,
        r: Math.random() * 2 + 1,
        vy: 1 + Math.random() * 1,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
      });
      // Play thrust sound (restart quickly)
      thrustSound.currentTime = 0;
      thrustSound.play();
    }

    // Spawn obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const size = 15 + Math.random() * 20;
      obstacles.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        r: size / 2,
        vy: 2 + score * 0.02,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
      spawnTimer = 800 - Math.min(600, score * 10); // faster spawns over time
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.vy;
      if (o.y - o.r > canvas.height) obstacles.splice(i, 1);
    }

    // Collision detection (circle‑rect)
    for (const o of obstacles) {
      const cx = o.x + o.r;
      const cy = o.y + o.r;
      const rx = ship.x, ry = ship.y, rw = ship.w, rh = ship.h;
      const nearestX = Math.max(rx, Math.min(cx, rx + rw));
      const nearestY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - nearestX, dy = cy - nearestY;
      if (dx * dx + dy * dy < o.r * o.r) { gameOver = true; explosionSound.currentTime = 0; explosionSound.play(); break; }
    }

    score += dt / 1000; // seconds
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background – starfield
    // Draw moving stars for parallax effect
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars array (initialized lazily)
    if (!window.__stars) {
      const starCount = Math.max(50, Math.floor((canvas.width * canvas.height) / 8000));
      window.__stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      }));
    }
    const stars = window.__stars;
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship – gradient triangle
    // Exhaust particles rendering
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Ship – gradient triangle
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff'); // teal top
    shipGrad.addColorStop(1, '#00f'); // blue bottom
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // optional outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Obstacles – rotating gray rocks
    for (const o of obstacles) {
      // update rotation
      o.angle += o.rotSpeed;
      ctx.save();
      ctx.translate(o.x + o.r, o.y + o.r);
      ctx.rotate(o.angle);
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(0, 0, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Score
    ctx.fillStyle = '#0f0';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // Game over overlay
    if (gameOver) {
      // pause background music on game over
      if (!backgroundMusic.paused) backgroundMusic.pause();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = time => {
    const dt = time - lastTime;
    lastTime = time;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Start after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(loop));
  } else {
    requestAnimationFrame(loop);
  }
})();
