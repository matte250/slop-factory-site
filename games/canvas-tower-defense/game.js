// Minimal Tower‑Defense on canvas id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio context and simple tone player
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const maxCannons = 5;
  const cannons = [];
  const orbs = [];
  const shots = [];
  const particles = [];
  let score = 0;
  let lastOrbTime = 0;
  let orbInterval = 2000; // ms, will speed up each wave
  let wave = 1;
  let gameOver = false;

  // ---------- Helpers ----------
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---------- Event ----------
  canvas.addEventListener('click', (e) => {
    // resume AudioContext on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (cannons.length >= maxCannons) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cannons.push({ x, y, angle: 0, lastShot: 0 });
  });

  // ---------- Game Loop ----------
  function loop(timestamp) {
    if (gameOver) return;
    // clear previous frame
    ctx.clearRect(0, 0, width, height);
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);


    // spawn orbs
    if (timestamp - lastOrbTime > orbInterval) {
      const laneCount = 5;
      const laneWidth = width / laneCount;
      const lane = Math.floor(Math.random() * laneCount);
      const x = lane * laneWidth + laneWidth / 2;
      const speed = 0.5 + wave * 0.1;
      const color = ['red', 'green', 'blue', 'orange', 'purple'][Math.floor(Math.random() * 5)];
      orbs.push({ x, y: -10, r: 10, speed, color });
      lastOrbTime = timestamp;
      // gradually increase difficulty
      if (orbs.length % 10 === 0) {
        wave++;
        orbInterval = Math.max(500, orbInterval - 100);
      }
    }

    // update and draw orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.speed;
      if (o.y - o.r > height) { gameOver = true; break; }
        // draw orb with radial gradient for depth
        const orbGrad = ctx.createRadialGradient(o.x, o.y, o.r * 0.2, o.x, o.y, o.r);
        orbGrad.addColorStop(0, '#fff');
        orbGrad.addColorStop(1, o.color);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();
    }

    // cannons rotate and fire
    // draw cannons with base circle and gradient barrel
    for (const c of cannons) {
      // rotate towards nearest orb
      let target = null;
      let minDist = Infinity;
      for (const o of orbs) {
        const d = dist(c, o);
        if (d < minDist) { minDist = d; target = o; }
      }
      if (target) {
        const angle = Math.atan2(target.y - c.y, target.x - c.x);
        c.angle = angle;
        // fire rate: one shot per 800 ms, faster with higher wave
        const fireRate = 800 / wave;
        if (timestamp - c.lastShot > fireRate) {
          shots.push({ x: c.x, y: c.y, angle: c.angle, speed: 2 + wave * 0.2 });
          playTone(200 + wave * 20, 'square', 0.08);
          c.lastShot = timestamp;
        }
      }
      // draw cannon base
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#777';
      ctx.fill();
      // draw barrel with gradient
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      const barrelGrad = ctx.createLinearGradient(0, -10, 0, 10);
      barrelGrad.addColorStop(0, '#aaa');
      barrelGrad.addColorStop(1, '#333');
      ctx.fillStyle = barrelGrad;
      ctx.fillRect(-5, -10, 10, 20);
      ctx.restore();
    }

    // update and draw shots
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      // remove if out of bounds
      if (s.x < 0 || s.x > width || s.y < 0 || s.y > height) {
        shots.splice(i, 1);
        continue;
      }
        // draw shot with radial glow
        const shotGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 3);
        shotGrad.addColorStop(0, '#fff');
        shotGrad.addColorStop(1, '#555');
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = shotGrad;
        ctx.fill();
    }

    // collision detection and particle burst on hit
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      for (let j = orbs.length - 1; j >= 0; j--) {
        const o = orbs[j];
        if (dist(s, o) < o.r + 3) {
          // hit! create particles and sound
          shots.splice(i, 1);
          orbs.splice(j, 1);
          score += 10;
          playTone(500 + wave * 30, 'triangle', 0.1);
          for (let p = 0; p < 8; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1.5 + 0.5;
            particles.push({
              x: o.x,
              y: o.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: Math.random() * 2 + 1,
              life: 30,
              color: o.color,
            });
          }
          break;
        }
      }
    }

    // draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (!gameOver) {
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText('Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  requestAnimationFrame(loop);
})();
