// Simple Space Debris Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');

  // Audio context (will be resumed on first user interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple helper to play a short beep
  function playBeep(freq, duration = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playShoot() { playBeep(600); }
  function playExplosion() { playBeep(200, 0.2); }
  function playGameOver() { playBeep(100, 0.5); }
  // Ensure audio context is resumed on first click/keydown
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Player
  const PLAYER_WIDTH = 40;
  const PLAYER_HEIGHT = 20;
  const PLAYER_SPEED = 300; // px/s
  const player = { x: WIDTH / 2 - PLAYER_WIDTH / 2, y: HEIGHT - PLAYER_HEIGHT - 5, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };

  // Input state
  const keys = { ArrowLeft: false, ArrowRight: false, Space: false };

  // Starfield background
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, r: Math.random() * 1.5 + 0.5 });
  }

  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Bullets
  const bullets = [];
  const BULLET_SPEED = 400; // px/s
  const BULLET_WIDTH = 4;
  const BULLET_HEIGHT = 10;

  // Debris
  const debris = [];
  let debrisSpawnTimer = 0;
  const SPAWN_INTERVAL = 1.0; // seconds
  let debrisSpeed = 100; // px/s, will increase over time

  let lastTime = 0;
  let score = 0;
  let gameOver = false;
  let gameOverPlayed = false;
  function spawnDebris() {
    const size = 20 + Math.random() * 20;
    const x = Math.random() * (WIDTH - size);
    // Each debris gets a random rotation angle for visual spin
    const rot = Math.random() * Math.PI * 2;
    // Optional subtle color variation per piece
    const hue = 200 + Math.random() * 40; // bluish-gray
    debris.push({ x, y: -size, w: size, h: size, rot, hue });
  }

  function update(dt) {
    if (gameOver) return;

    // Player movement
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED * dt;
    if (keys.ArrowRight) player.x += PLAYER_SPEED * dt;
    // Clamp within canvas
    player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

    // Shooting
    if (keys.Space) {
      // Simple rate limit: fire one bullet per 0.2s
        if (!player.lastShot || performance.now() - player.lastShot > 200) {
          bullets.push({ x: player.x + player.w / 2 - BULLET_WIDTH / 2, y: player.y, w: BULLET_WIDTH, h: BULLET_HEIGHT });
          player.lastShot = performance.now();
          playShoot();
        }
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= BULLET_SPEED * dt;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Spawn debris over time, speed increases gradually
    debrisSpawnTimer += dt;
    if (debrisSpawnTimer >= SPAWN_INTERVAL) {
      spawnDebris();
      debrisSpawnTimer = 0;
    }
    debrisSpeed += dt * 5; // accelerate
    // Update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += debrisSpeed * dt;
      // Check collision with player
        if (rectIntersect(d, player)) {
          gameOver = true;
          if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
          break;
        }
        // Check if debris reached bottom
        if (d.y + d.h >= HEIGHT) {
          gameOver = true;
          if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
          break;
        }
      // Check bullet collisions
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (rectIntersect(d, b)) {
          // Remove both
          playExplosion();
          debris.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          break;
        }
      }
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player ship (gradient triangle with glow)
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'cyan';
    const grad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#0ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Bullets (small orange circles)
    ctx.fillStyle = 'orange';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + b.w/2, b.y + b.h/2, Math.max(b.w, b.h)/2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Debris (rotating squares with color variation)
    debris.forEach(d => {
      ctx.save();
      ctx.translate(d.x + d.w/2, d.y + d.h/2);
      ctx.rotate(d.rot || 0);
      // Use hue if provided for subtle color variation
      ctx.fillStyle = d.hue ? `hsl(${d.hue}, 30%, 50%)` : 'gray';
      ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);
      ctx.restore();
    });

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
