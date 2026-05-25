// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Audio setup (using public domain placeholder URLs)
  const bgMusic = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'); // replace with actual bg music
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  const moveSound = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'); // placeholder for movement
  moveSound.volume = 0.1;
  const crashSound = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'); // placeholder for crash
  crashSound.volume = 0.5;
  let audioStarted = false;

  // Ship definition
  const ship = {x: W / 2, y: H - 60, w: 30, h: 30, speed: 4};

  // Asteroid pool
  const asteroids = [];
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2});
  }
  const asteroidSpawnRate = 90; // frames
  let frameCount = 0; let score = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // start background music on first user interaction
    if (!audioStarted) {
      bgMusic.play();
      audioStarted = true;
    }
    // play move sound for navigation keys
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      moveSound.currentTime = 0;
      moveSound.play();
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (W - size);
    const y = -size;
    const speed = 2 + Math.random() * 2;
    asteroids.push({x, y, w: size, h: size, speed});
  }

  function update() {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // Spawn asteroids
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > H) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (rectIntersect(ship, a)) {
        cancelAnimationFrame(rAF);
        alert('Game Over');
        return;
      }
    }
    frameCount++; score++;
    draw();
    rAF = requestAnimationFrame(update);
  }

  function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function drawStarfield() {
    // dark space background
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    // moving stars (parallax)
    ctx.fillStyle = '#fff';
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.y += s.speed;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    }
  }

  function draw() {
    drawStarfield();
    // draw ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // draw asteroids as circles with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.2, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    }
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  let rAF = requestAnimationFrame(update);
})();
