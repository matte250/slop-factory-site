// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // ----- Visual Enhancements -----
  // starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
  }
  // explosion particles
  const particles = [];
  function spawnExplosion(x, y, color) {
    // Play explosion sound
    playTone(200, 0.2);
    for (let i = 0; i < 15; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 30,
        color
      });
    }
  }

  // ----- Player -----
  const player = {
    w: 40,
    h: 20,
    x: W / 2 - 20,
    y: H - 30,
    speed: 5,
    color: '#0f0',
    cooldown: 0
  };

  // ----- Game state -----
  const asteroids = [];
  const lasers = [];
  let score = 0;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ----- Helper functions -----
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 1 + Math.random() * 2 + score * 0.001
    });
  }

  function update() {
    if (gameOver) return;
    // Player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    // Shooting
    if (keys['Space'] && player.cooldown <= 0) {
      lasers.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10, speed: 7 });
      player.cooldown = 15; // frames
      playTone(900, 0.08); // laser fire sound
    }
    if (player.cooldown > 0) player.cooldown--;

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= l.speed;
      if (l.y + l.h < 0) lasers.splice(i, 1);
    }

    // Update particles (fade out)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Spawn asteroids periodically
    if (Math.random() < 0.02) spawnAsteroid();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with player
      if (a.x < player.x + player.w && a.x + a.w > player.x && a.y + a.h > player.y) {
        spawnExplosion(player.x + player.w / 2, player.y, '#ff0');
        gameOver = true;
      }
      // collision with lasers
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        if (l.x < a.x + a.w && l.x + l.w > a.x && l.y < a.y + a.h && l.y + l.h > a.y) {
          lasers.splice(j, 1);
          asteroids.splice(i, 1);
          score++;
          spawnExplosion(a.x + a.w / 2, a.y + a.h / 2, '#f55');
          break;
        }
      }
      // asteroid passes bottom
      if (a.y > H) {
        asteroids.splice(i, 1);
        // could reduce score or ignore; treat as missed
      }
    }
  }

function draw() {
    // Background starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.r, s.r));
    // Particles (explosions)
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life / 30, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Player (triangle ship)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // Lasers (glowing)
    ctx.fillStyle = '#ff0';
    lasers.forEach(l => {
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 6;
      ctx.fillRect(l.x, l.y, l.w, l.h);
    });
    ctx.shadowBlur = 0;
    // Asteroids (circles with gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#ff777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
