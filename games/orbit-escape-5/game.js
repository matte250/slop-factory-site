// Minimal Orbit Escape game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  const center = () => ({ x: canvas.width / 2, y: canvas.height / 2 });
  const ship = { r: 10, angle: 0, dist: 60, vx: 0, vy: 0, thrust: 0.2 };
  const gravity = 0.05; // acceleration toward planet
  let score = 0;
  let orbs = [];
  const spawnOrb = () => {
    const ang = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * (Math.min(canvas.width, canvas.height) / 2 - 30);
    const x = center().x + Math.cos(ang) * d;
    const y = center().y + Math.sin(ang) * d;
    orbs.push({ x, y, r: 5, collected: false });
  };
  for (let i = 0; i < 5; i++) spawnOrb();

  const applyThrust = () => {
    resumeAudio();
    playTone(300, 0.08); // thrust sound
    const c = center();
    const dx = ship.x - c.x;
    const dy = ship.y - c.y;
    const len = Math.hypot(dx, dy);
    ship.vx += (dx / len) * ship.thrust;
    ship.vy += (dy / len) * ship.thrust;
  };

  const update = () => {
    const c = center();
    // position from polar
    ship.x = c.x + Math.cos(ship.angle) * ship.dist;
    ship.y = c.y + Math.sin(ship.angle) * ship.dist;
    // gravity pulls toward center
    const dx = c.x - ship.x;
    const dy = c.y - ship.y;
    const dist = Math.hypot(dx, dy);
    const ax = (dx / dist) * gravity;
    const ay = (dy / dist) * gravity;
    ship.vx += ax;
    ship.vy += ay;
    // integrate
    ship.x += ship.vx;
    ship.y += ship.vy;
    // convert back to polar
    const relX = ship.x - c.x;
    const relY = ship.y - c.y;
    ship.dist = Math.hypot(relX, relY);
    ship.angle = Math.atan2(relY, relX);
    // lose condition: hit planet (dist < 30) or out of bounds
    if (ship.dist < 30) {
      playTone(150, 0.3); // crash sound
      alert('Crashed! Score: ' + score);
      document.location.reload();
    }
    if (ship.x < 0 || ship.x > canvas.width || ship.y < 0 || ship.y > canvas.height) {
      playTone(800, 0.3); // escape sound
      alert('Escaped! Score: ' + score);
      document.location.reload();
    }
    // collect orbs
    orbs.forEach(o => {
      if (!o.collected && Math.hypot(ship.x - o.x, ship.y - o.y) < ship.r + o.r) {
        o.collected = true;
        score++;
        playTone(600, 0.1); // orb collected sound
        spawnOrb();
      }
    });
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // orbit path
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, ship.dist, 0, Math.PI * 2);
    ctx.stroke();

    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 5, canvas.width / 2, canvas.height / 2, 30);
    planetGrad.addColorStop(0, '#666');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
    ctx.fill();

    // draw orbs with glow
    orbs.forEach(o => {
      if (!o.collected) {
        const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        orbGrad.addColorStop(0, '#0f0');
        orbGrad.addColorStop(1, '#030');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // ship with glow and stroke
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle + Math.PI / 2);
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r / 2, ship.r);
    ctx.lineTo(-ship.r / 2, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // controls
  addEventListener('mousedown', applyThrust);
  addEventListener('keydown', e => { if (e.code === 'Space') applyThrust(); });

  loop();
})();
