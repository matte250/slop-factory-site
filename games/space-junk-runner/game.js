// Simple side‑scrolling game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // star field for background
  let stars = [];
  // audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(300, 0.07);
  const playCollision = () => playTone(80, 0.4);

  // Full‑window canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // generate star field
    stars = [];
    const starCount = Math.floor(canvas.width * canvas.height * 0.00005);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
      });
    }
  };
  window.addEventListener('resize', resize);
  resize();

  // Satellite (player)
  const sat = {
    x: 80,
    y: canvas.height / 2,
    r: 15,
    vy: 0,
  };
  const GRAVITY = 0.35;
  const THRUST = -7;

  // Debris (obstacles)
  const debris = [];
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 90; // frames
  let score = 0;
  let gameOver = false;

  const input = () => {
    sat.vy = THRUST;
    // ensure audio context is running then play thrust sound
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playThrust();
  };
  // mouse / touch input
  canvas.addEventListener('mousedown', input);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); input(); });

  const spawnDebris = () => {
    const size = 20 + Math.random() * 20;
    const y = Math.random() * (canvas.height - size) + size / 2;
    const speed = 3 + score * 0.005;
    debris.push({ x: canvas.width + size, y, r: size / 2, speed });
  };

  const update = () => {
    if (gameOver) return;
    // satellite physics
    sat.vy += GRAVITY;
    sat.y += sat.vy;

    // animate star field (slow leftward drift)
    for (const s of stars) {
      s.x -= 0.5;
      if (s.x < 0) s.x = canvas.width;
    }

    // move debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x -= d.speed;
      if (d.x + d.r < 0) debris.splice(i, 1);
    }

    // spawn new debris
    if (spawnTimer <= 0) {
      spawnDebris();
      spawnTimer = SPAWN_INTERVAL;
    } else {
      spawnTimer--;
    }

    // collision detection
    for (const d of debris) {
      const dx = sat.x - d.x;
      const dy = sat.y - d.y;
      const dist = Math.hypot(dx, dy);
      if (dist < sat.r + d.r) {
        gameOver = true;
        // play collision sound
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playCollision();
        break;
      }
    }

    // lose condition: out of canvas
    if (sat.y - sat.r < 0 || sat.y + sat.r > canvas.height) {
      gameOver = true;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playCollision();
    }

    if (!gameOver) score++;
  };

  const draw = () => {
    // dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw satellite with gradient
    const grad = ctx.createRadialGradient(sat.x, sat.y, sat.r * 0.2, sat.x, sat.y, sat.r);
    grad.addColorStop(0, '#66ffff');
    grad.addColorStop(1, '#0033ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sat.x, sat.y, sat.r, 0, Math.PI * 2);
    ctx.fill();
    // draw debris with varied shades
    for (const d of debris) {
      const shade = Math.floor(155 + Math.random() * 100);
      ctx.fillStyle = `rgb(${shade},0,0)`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
