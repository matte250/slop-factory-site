// Simple "Pixel Patrol" canvas game
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playShoot() { playTone(440, 80); }
  function playExplosion() { playTone(200, 150); }
  function playGameOver() { playTone(100, 300); }
  // Create starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const ship = { w: 30, h: 10, x: width / 2 - 15, y: height - 20, speed: 4 };
  const bullets = [];
  const aliens = [];
  let score = 0;
  let damage = 0;
  const maxDamage = 3;
  let lastAlienSpawn = 0;
  const alienSpawnInterval = 2000; // ms
  const alienSpeed = 0.5;
  const bulletSpeed = 5;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAliens() {
    const cols = 8;
    const rows = 2;
    const alienW = 20;
    const alienH = 15;
    const padding = 5;
    const offsetX = (width - (cols * (alienW + padding))) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: offsetX + c * (alienW + padding),
          y: r * (alienH + padding),
          w: alienW,
          h: alienH,
        });
      }
    }
  }

  function update(dt) {
  // Update stars (slow drift)
  stars.forEach(s => { s.y += 0.2; if (s.y > height) s.y = 0; });
    // Ship movement
    if (keys['ArrowLeft'] && ship.x > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w < width) ship.x += ship.speed;
    // Shooting
    if (keys[' '] && !keys['_spacePressed']) {
      bullets.push({ x: ship.x + ship.w / 2, y: ship.y, w: 2, h: 8 });
      playShoot();
      keys['_spacePressed'] = true;
    }
    if (!keys[' ']) keys['_spacePressed'] = false;

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= bulletSpeed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Spawn aliens periodically
    if (performance.now() - lastAlienSpawn > alienSpawnInterval) {
      spawnAliens();
      lastAlienSpawn = performance.now();
    }

    // Update aliens
    for (let i = aliens.length - 1; i >= 0; i--) {
      const a = aliens[i];
      a.y += alienSpeed;
      // Check if alien reached bottom
      if (a.y + a.h >= height) {
        aliens.splice(i, 1);
        damage++;
        if (damage >= maxDamage) {
          gameOver();
          return;
        }
      }
    }

    // Collision detection bullet‑alien
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = aliens.length - 1; j >= 0; j--) {
        const a = aliens[j];
        if (
          b.x < a.x + a.w &&
          b.x + b.w > a.x &&
          b.y < a.y + a.h &&
          b.y + b.h > a.y
        ) {
          bullets.splice(i, 1);
          aliens.splice(j, 1);
          score++;
          playExplosion();
          break;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Bullets (glow circles)
    bullets.forEach(b => {
      const grad = ctx.createRadialGradient(b.x + b.w/2, b.y + b.h/2, 0, b.x + b.w/2, b.y + b.h/2, b.w);
      grad.addColorStop(0, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w, 0, Math.PI*2);
      ctx.fill();
    });
    // Aliens (glow circles)
    aliens.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, 0, a.x + a.w/2, a.y + a.h/2, a.w);
      grad.addColorStop(0, 'rgba(255,0,0,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w, 0, Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 15);
    ctx.fillText(`Damage: ${damage}/${maxDamage}`, 10, 30);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (damage < maxDamage) requestAnimationFrame(loop);
  }

  function gameOver() { playGameOver();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 10);
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
  }

  // Start loop
  requestAnimationFrame(loop);
})();
