// Neon Escape – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // Game state
  let score = 0;
  let timer = 30; // seconds remaining
  let lastOrb = Date.now();
  const speed = 2; // forward speed (pixels per frame)
  const rotateSpeed = Math.PI / 90; // radians per key press
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(800, 0.08);
  const playCrash = () => playTone(150, 0.4);
  // Resume audio on first user interaction
  const resumeAudio = () => audioCtx.state === 'suspended' && audioCtx.resume();
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('click', resumeAudio, { once: true });

  const triangle = { x: W / 2, y: H - 80, angle: -Math.PI / 2, size: 30 };
  const obstacles = [];
  const orbs = [];

  // utilities
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pointInPoly = (px, py, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const createObstacle = () => {
    const w = rand(80, 180);
    const h = 20;
    const y = -h;
    const x = rand(0, W - w);
    const rot = rand(0, Math.PI * 2);
    obstacles.push({ x, y, w, h, rot, speed: speed * 0.8 });
  };

  const createOrb = () => {
    const r = 8;
    const x = rand(r, W - r);
    const y = -r;
    orbs.push({ x, y, r, speed: speed * 0.6 });
  };

  // input
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const update = dt => {
    // move triangle
    if (keys.ArrowLeft) triangle.angle -= rotateSpeed;
    if (keys.ArrowRight) triangle.angle += rotateSpeed;

    // advance obstacles and orbs
    const move = obj => (obj.y += obj.speed);
    obstacles.forEach(move);
    orbs.forEach(move);

    // remove off‑screen
    obstacles.filter(o => o.y < H + o.h);
    while (obstacles.length && obstacles[0].y > H) obstacles.shift();
    while (orbs.length && orbs[0].y > H) orbs.shift();

    // spawn logic
    if (Math.random() < 0.02) createObstacle();
    if (Math.random() < 0.01) createOrb();

    // triangle polygon for collision
    const s = triangle.size;
    const cx = triangle.x,
      cy = triangle.y;
    const pts = [
      [cx + Math.cos(triangle.angle) * s, cy + Math.sin(triangle.angle) * s],
      [cx + Math.cos(triangle.angle + Math.PI * 0.8) * s * 0.6, cy + Math.sin(triangle.angle + Math.PI * 0.8) * s * 0.6],
      [cx + Math.cos(triangle.angle - Math.PI * 0.8) * s * 0.6, cy + Math.sin(triangle.angle - Math.PI * 0.8) * s * 0.6]
    ];

    // collisions
    for (const obs of obstacles) {
      // simple AABB check before polygon test
      const obRect = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
      const triBox = { x: cx - s, y: cy - s, w: s * 2, h: s * 2 };
      if (
        triBox.x < obRect.x + obRect.w &&
        triBox.x + triBox.w > obRect.x &&
        triBox.y < obRect.y + obRect.h &&
        triBox.y + triBox.h > obRect.y
      ) {
        // point‑in‑rotated‑rect test
        const cxObs = obs.x + obs.w / 2;
        const cyObs = obs.y + obs.h / 2;
        const sin = Math.sin(-obs.rot), cos = Math.cos(-obs.rot);
        const inPoly = pts.every(p => {
          const dx = p[0] - cxObs,
            dy = p[1] - cyObs;
          const rx = dx * cos - dy * sin + cxObs;
          const ry = dx * sin + dy * cos + cyObs;
          return rx > obs.x && rx < obs.x + obs.w && ry > obs.y && ry < obs.y + obs.h;
        });
        if (inPoly) {
          // game over – stop loop with sound
          playCrash();
          cancelAnimationFrame(animId);
          alert('Game Over! Score: ' + score);
          return false;
        }
      }
    }

    // orb collection
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      const dist = Math.hypot(orb.x - cx, orb.y - cy);
if (dist < s) {
          score++;
          timer = Math.min(30, timer + 1);
          lastOrb = Date.now();
          playCollect();
          orbs.splice(i, 1);
        }
    }

    // timer decay when no orb collected for 10 s
    if (Date.now() - lastOrb > 10000) timer -= dt / 1000;
    if (timer <= 0) {
      cancelAnimationFrame(animId);
      alert('Time Up! Score: ' + score);
      return false;
    }
    return true;
  };

  const draw = () => {
    // draw semi‑transparent dark overlay for motion blur
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(0, 0, W, H);
  // optional background gradient (dark to black)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#001020");
  bgGrad.addColorStop(1, "#000");
  ctx.fillStyle = bgGrad;
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
    // draw triangle with neon glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    const gradTri = ctx.createLinearGradient(0, 0, 0, H);
    gradTri.addColorStop(0, '#0ff');
    gradTri.addColorStop(1, '#06f');
    ctx.fillStyle = gradTri;
    ctx.beginPath();
    const s = triangle.size;
    const cx = triangle.x,
      cy = triangle.y;
    ctx.moveTo(cx + Math.cos(triangle.angle) * s, cy + Math.sin(triangle.angle) * s);
    ctx.lineTo(
      cx + Math.cos(triangle.angle + Math.PI * 0.8) * s * 0.6,
      cy + Math.sin(triangle.angle + Math.PI * 0.8) * s * 0.6
    );
    ctx.lineTo(
      cx + Math.cos(triangle.angle - Math.PI * 0.8) * s * 0.6,
      cy + Math.sin(triangle.angle - Math.PI * 0.8) * s * 0.6
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // obstacles with neon glow
    for (const o of obstacles) {
      ctx.save();
      // neon gradient fill
      const gradObs = ctx.createLinearGradient(0, -o.h / 2, 0, o.h / 2);
      gradObs.addColorStop(0, '#f44');
      gradObs.addColorStop(1, '#a00');
      ctx.fillStyle = gradObs;
      ctx.shadowColor = '#f44';
      ctx.shadowBlur = 10;
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.rot);
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    }

    // orbs with glow
    for (const orb of orbs) {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 12;
      const gradOrb = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      gradOrb.addColorStop(0, '#ff0');
      gradOrb.addColorStop(1, '#aa0');
      ctx.fillStyle = gradOrb;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Time: ' + timer.toFixed(1), 10, 40);
  };

  let last = performance.now();
  let animId;
  const loop = now => {
    const dt = now - last;
    last = now;
    if (update(dt)) {
      draw();
      animId = requestAnimationFrame(loop);
    }
  };
  animId = requestAnimationFrame(loop);
})();
