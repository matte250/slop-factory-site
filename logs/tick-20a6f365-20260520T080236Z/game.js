// Light Runner – minimal canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // star field for background
  const STAR_COUNT = 100;
  let stars = [];
  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }
  initStars();
  // handle resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  });

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // background hum (low volume)
  let humOsc = null;
  function startHum() {
    humOsc = audioCtx.createOscillator();
    const humGain = audioCtx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.value = 60;
    humGain.gain.value = 0.02;
    humOsc.connect(humGain).connect(audioCtx.destination);
    humOsc.start();
  }
  function stopHum() {
    if (humOsc) { humOsc.stop(); humOsc.disconnect(); humOsc = null; }
  }
  // start ambient hum once user interacts (required by browsers)
  window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); startHum(); }, { once: true });

  // ----- Game state -----
  const player = { x: canvas.width / 2, y: canvas.height / 2, r: 10, speed: 3 };
  let score = 0;
  let gameOver = false;

  // simple light radius (visual only)
  const LIGHT_RADIUS = 120;

  // spawn helpers
  const randPos = (margin = 20) => ({
    x: Math.random() * (canvas.width - 2 * margin) + margin,
    y: Math.random() * (canvas.height - 2 * margin) + margin,
  });

  const crystals = Array.from({ length: 15 }, () => ({ ...randPos(), r: 5 }));
  const enemies = Array.from({ length: 5 }, () => {
    const pos = randPos();
    return {
      ...pos,
      r: 12,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    };
  });

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep player inside canvas
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    // move enemies with slight drift and bounce
    for (const e of enemies) {
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < e.r || e.x > canvas.width - e.r) e.vx *= -1;
      if (e.y < e.r || e.y > canvas.height - e.r) e.vy *= -1;
    }

    // twinkle stars
    for (const s of stars) {
      s.opacity += (Math.random() - 0.5) * 0.02;
      s.opacity = Math.max(0.2, Math.min(0.8, s.opacity));
    }

    // collect crystals
    for (let i = crystals.length - 1; i >= 0; i--) {
      const c = crystals[i];
      const d = Math.hypot(player.x - c.x, player.y - c.y);
      if (d < player.r + c.r) {
        crystals.splice(i, 1);
        score++;
        playTone(800, 'triangle', 0.1); // crystal collect sound
      }
    }
    // collision with enemies – game over
    for (const e of enemies) {
      const d = Math.hypot(player.x - e.x, player.y - e.y);
      if (d < player.r + e.r) {
        gameOver = true;
        playTone(200, 'sawtooth', 0.5); // collision / game over sound
        stopHum();
        break;
      }
    }
  }

function draw() {
    // dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw star field
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // light effect around the player (soft glow)
    const gradient = ctx.createRadialGradient(
      player.x, player.y, 0,
      player.x, player.y, LIGHT_RADIUS
    );
    gradient.addColorStop(0, 'rgba(255,255,200,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw crystals with subtle glow
    crystals.forEach(c => {
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 3);
      glow.addColorStop(0, 'rgba(0,255,255,0.6)');
      glow.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw enemies with radial glow
    enemies.forEach(e => {
      const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 2);
      eg.addColorStop(0, 'rgba(255,100,100,0.5)');
      eg.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw player (glowing orb with inner glow)
    const pg = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 3);
    pg.addColorStop(0, 'rgba(255,255,150,0.9)');
    pg.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // UI – score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start on load
  window.addEventListener('load', () => requestAnimationFrame(loop));
})();
