// Simple Cosmic Courier game – enhanced graphics with sound
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Simple tone player
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration * 1000);
  }
  function playCollision() { playTone(200, 0.08, 'square'); }
  function playDelivery() { playTone(600, 0.3, 'triangle'); }
  function playGameOver() { playTone(100, 0.5, 'sawtooth'); }

  const canvas = document.getElementById('game');
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Starfield for background
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
  }));

  // Game state
  const state = {
    ship: { x: width / 2, y: height - 60, radius: 15, hp: 3, speed: 3 },
    keys: {},
    asteroids: [],
    timer: 30, // seconds to deliver
    lastTime: 0,
    elapsed: 0,
    delivered: false,
    deliveryPlayed: false,
    gameOverPlayed: false,
  };

  // Input handling
  window.addEventListener('keydown', e => (state.keys[e.key] = true));
  window.addEventListener('keyup', e => (state.keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size * 2) + size;
    const y = -size;
    const speed = Math.random() * 1.5 + 0.5;
    // Give each asteroid a subtle color gradient
    const hue = Math.floor(Math.random() * 40) + 200; // bluish
    state.asteroids.push({ x, y, size, speed, hue });
  }

  function update(dt) {
    // timer
    state.elapsed += dt;
    if (state.elapsed >= 1) {
      state.timer -= 1;
      state.elapsed = 0;
    }
    if (state.timer <= 0) state.ship.hp = 0; // lose by timeout

    // ship movement (arrow keys or WASD)
    const s = state.ship;
    if (state.keys['ArrowLeft'] || state.keys['a']) s.x -= s.speed;
    if (state.keys['ArrowRight'] || state.keys['d']) s.x += s.speed;
    if (state.keys['ArrowUp'] || state.keys['w']) s.y -= s.speed;
    if (state.keys['ArrowDown'] || state.keys['s']) s.y += s.speed;
    // clamp
    s.x = Math.max(s.radius, Math.min(width - s.radius, s.x));
    s.y = Math.max(s.radius, Math.min(height - s.radius, s.y));

    // asteroids movement
    for (const a of state.asteroids) {
      a.y += a.speed;
    }
    // remove off‑screen
    state.asteroids = state.asteroids.filter(a => a.y - a.size < height);
    // spawn new occasionally
    if (Math.random() < 0.02) spawnAsteroid();

    // collision detection
    for (const a of state.asteroids) {
      const dx = a.x - s.x;
      const dy = a.y - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + s.radius) {
        s.hp -= 1;
        playCollision();
        a.size = 0; // destroy asteroid
      }
    }
    // simple win: survive until timer runs out with hp>0
    if (state.timer <= 0 && s.hp > 0) {
      if (!state.deliveryPlayed) {
        playDelivery();
        state.deliveryPlayed = true;
      }
      state.delivered = true;
    }
    // Game over sound when health drops to 0
    if (s.hp <= 0 && !state.gameOverPlayed) {
      playGameOver();
      state.gameOverPlayed = true;
    }
  }

  function draw() {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship – draw as a simple triangular courier ship with a glow based on health
    const s = state.ship;
    const shipGrad = ctx.createRadialGradient(s.x, s.y, s.radius / 2, s.x, s.y, s.radius);
    shipGrad.addColorStop(0, s.hp > 0 ? '#0f8' : '#f44');
    shipGrad.addColorStop(1, s.hp > 0 ? '#030' : '#400');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - s.radius);
    ctx.lineTo(s.x - s.radius, s.y + s.radius);
    ctx.lineTo(s.x + s.radius, s.y + s.radius);
    ctx.closePath();
    ctx.fill();

    // Asteroids – use their hue for subtle coloring
    for (const a of state.asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.3, a.x, a.y, a.size);
      grad.addColorStop(0, `hsl(${a.hue}, 30%, 70%)`);
      grad.addColorStop(1, `hsl(${a.hue}, 30%, 40%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD – drop shadow for readability
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(`HP: ${s.hp}`, 10, 20);
    ctx.fillText(`Time: ${state.timer}s`, 10, 40);
    ctx.shadowBlur = 0;
    if (state.delivered) {
      ctx.fillStyle = '#0ff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Package Delivered!', width / 2 - 100, height / 2);
    }
    if (s.hp <= 0) {
      ctx.fillStyle = '#f55';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;
    if (state.ship.hp > 0 && !state.delivered) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame
    }
  }

  requestAnimationFrame(loop);
})();
