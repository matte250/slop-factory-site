// Simple Meteor Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stars = [];
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    // generate star field
    const count = Math.floor((canvas.width * canvas.height) / 8000);
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
    }
  };
  resize();
  addEventListener('resize', resize);

  const ship = { w: 40, h: 20, x: innerWidth / 2, y: innerHeight - 30, speed: 6, dir: 0 };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playHit = () => playSound(150, 200);
  const playScore = () => playSound(440, 100);
  const playGameOver = () => {
    // descending tones
    const notes = [200, 180, 160, 140, 120];
    notes.forEach((f, i) => setTimeout(() => playSound(f, 150), i * 200));
  };
  const meteors = [];
  let score = 0, lives = 3, lastSpawn = 0, spawnInterval = 1000;

  // Input handling
  addEventListener('keydown', e => { if (e.key === 'ArrowLeft') ship.dir = -1; else if (e.key === 'ArrowRight') ship.dir = 1; });
  addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ship.dir = 0; });
  addEventListener('mousemove', e => { ship.x = e.clientX; });
  // resume audio on first interaction
  addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });

  const spawnMeteor = () => {
    const radius = 15 + Math.random() * 10;
    meteors.push({ x: Math.random() * (canvas.width - radius * 2) + radius, y: -radius, r: radius, speed: 2 + Math.random() * 3 });
  };

  const update = (dt) => {
    // Ship movement
    ship.x += ship.dir * ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // Meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // collision (simple rect-circle)
      const dx = Math.max(ship.x, Math.min(m.x, ship.x + ship.w)) - m.x;
      const dy = Math.max(ship.y, Math.min(m.y, ship.y + ship.h)) - m.y;
      if (dx * dx + dy * dy < m.r * m.r) {
        // collision
        playHit();
        lives--; meteors.splice(i, 1);
        if (lives <= 0) {
          playGameOver();
          return false; // game over
        }
      } else if (m.y - m.r > canvas.height) {
        meteors.splice(i, 1);
        score++;
        playScore();
      }
    }
    // spawning
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
      // gradually increase difficulty
      spawnInterval = Math.max(300, spawnInterval - 20);
    }
    return true;
  };

  const draw = () => {
    // clear and draw background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) ctx.beginPath(), ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2), ctx.fill();
    // ship – draw as a triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // meteors – draw with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, '#ff9');
      grad.addColorStop(1, '#c30');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (update(dt)) {
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    }
  };
  requestAnimationFrame(loop);
})();
