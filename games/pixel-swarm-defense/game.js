// Pixel Swarm Defense – minimal implementation
// Canvas with id="game" must exist in the page.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure context is running after first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once:true});
  window.addEventListener('keydown', resumeAudio, {once:true});

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Player -----
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 12,
    angle: 0, // radians
    rotationSpeed: Math.PI / 90,
    color: '#0ff',
  };

  // ----- Bullets -----
  const bullets = [];
  const bulletSpeed = 6;
  const bulletRadius = 3;

  // ----- Enemies -----
  const enemies = [];
  const enemyRadius = 8;
  const enemySpeed = 1.5;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  // ----- Game state -----
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function update(dt) {
    if (gameOver) return;
    // rotate ship
    if (keys['ArrowLeft']) ship.angle -= ship.rotationSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotationSpeed;
    // fire
    if (keys['Space'] && !keys['_spacePressed']) {
      bullets.push({
        x: ship.x + Math.cos(ship.angle) * ship.radius,
        y: ship.y + Math.sin(ship.angle) * ship.radius,
        vx: Math.cos(ship.angle) * bulletSpeed,
        vy: Math.sin(ship.angle) * bulletSpeed,
      });
      // play shooting sound
      playTone(440, 0.08);
      keys['_spacePressed'] = true;
    }
    if (!keys['Space']) keys['_spacePressed'] = false;

    // update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy;
      // remove off‑screen
      if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) bullets.splice(i, 1);
    }

    // spawn enemies
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnEnemy();
      lastSpawn = performance.now();
    }

    // update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const dx = ship.x - e.x; const dy = ship.y - e.y;
      const dist = Math.hypot(dx, dy);
      e.x += (dx / dist) * enemySpeed;
      e.y += (dy / dist) * enemySpeed;

      // check collision with ship
      if (dist < e.radius + ship.radius) {
        gameOver = true;
      }
    }

    // bullet‑enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const d = Math.hypot(b.x - e.x, b.y - e.y);
        if (d < bulletRadius + e.radius) {
          // play hit sound
          playTone(220, 0.12);
          bullets.splice(i, 1);
          enemies.splice(j, 1);
          score++;
          break;
        }
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.1, width / 2, height / 2, Math.max(width, height) / 2);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ship with outline and subtle glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = 'rgba(0,255,255,0.4)';
    ctx.shadowBlur = 8;
    const shipGrad = ctx.createLinearGradient(-ship.radius, -ship.radius, ship.radius, ship.radius);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#0aa');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0c0c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // bullets with glow
    bullets.forEach(b => {
      ctx.shadowColor = 'rgba(255,255,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(b.x, b.y, bulletRadius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset shadow

    // enemies with gradient and slight pulse effect
    enemies.forEach(e => {
      const pulse = 0.8 + 0.2 * Math.sin(performance.now() / 200);
      const rad = e.radius * pulse;
      const grad = ctx.createRadialGradient(e.x, e.y, rad * 0.2, e.x, e.y, rad);
      grad.addColorStop(0, '#f44');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillText('Game Over', width / 2 - 40, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = 16; // fixed step for simplicity
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function spawnEnemy() {
    // pick edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * height; }
    else if (side === 1) { x = width; y = Math.random() * height; }
    else if (side === 2) { x = Math.random() * width; y = 0; }
    else { x = Math.random() * width; y = height; }
    enemies.push({ x, y, radius: enemyRadius });
  }

  // start loop
  requestAnimationFrame(loop);
})();
