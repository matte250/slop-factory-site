// Enhanced graphics: background stars, gradient, ship triangle, orb glow, particles
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 600;
  const ship = {x: WIDTH/2, y: HEIGHT/2, r: 12, speed: 3, color: '#0ff', angle: 0};
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  // resume AudioContext on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  // ensure audio ready on load
  if (audioCtx.state === 'running') {
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  }
  const keys = {};
  const orbs = [];
  const obstacles = [];
  let score = 0;
  let gameOver = false;
  // input
  addEventListener('keydown', e => keys[e.key] = true);
  addEventListener('keyup', e => keys[e.key] = false);
  // helpers
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const circleCollide = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2 < (a.r+b.r)**2;
  // spawning
  setInterval(() => {
    orbs.push({x: rnd(20, WIDTH-20), y: rnd(20, HEIGHT-20), r: 8, color: '#ff0'});
  }, 1500);
  setInterval(() => {
    const angle = rnd(0, Math.PI*2);
    const speed = rnd(1,2);
    obstacles.push({
      x: rnd(0, WIDTH), y: rnd(0, HEIGHT), r: 14,
      vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
      color: '#f44'
    });
  }, 2000);
  // particles for effects
  const particles = [];

  // main loop
  const update = () => {
    if (gameOver) return;
    // move ship with direction
    let dx = 0, dy = 0;
    if (keys['ArrowUp']||keys['w']) dy -= 1;
    if (keys['ArrowDown']||keys['s']) dy += 1;
    if (keys['ArrowLeft']||keys['a']) dx -= 1;
    if (keys['ArrowRight']||keys['d']) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      ship.x += (dx/len) * ship.speed;
      ship.y += (dy/len) * ship.speed;
      ship.angle = Math.atan2(dy, dx);
    }
    // keep inside
    ship.x = Math.max(ship.r, Math.min(WIDTH-ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(HEIGHT-ship.r, ship.y));
    // move obstacles
    obstacles.forEach(o => {
      o.x += o.vx; o.y += o.vy;
      if (o.x<o.r||o.x>WIDTH-o.r) o.vx*=-1;
      if (o.y<o.r||o.y>HEIGHT-o.r) o.vy*=-1;
    });
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= 1;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // check collisions
    for (let i = orbs.length - 1; i >= 0; i--) {
      if (circleCollide(ship, orbs[i])) {
        score++;
        beep(440, 100); // collection sound
        // create spark particles
        for (let j = 0; j < 8; j++) {
          const angle = rnd(0, Math.PI * 2);
          const speed = rnd(1, 3);
          particles.push({
            x: orbs[i].x,
            y: orbs[i].y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30,
            color: '#ff0'
          });
        }
        orbs.splice(i, 1);
      }
    }
    for (const o of obstacles) {
      if (circleCollide(ship, o)) {gameOver = true; break;}
    }
  };
  // generate star field once
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    r: Math.random() * 1.5 + 0.5
  }));

  const draw = () => {
    // background gradient
    const grad = ctx.createLinearGradient(0,0,0,HEIGHT);
    grad.addColorStop(0,'#001');
    grad.addColorStop(1,'#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r,0,Math.PI*2); ctx.fill();
    }
    // ship as triangle
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.r,0);
    ctx.lineTo(-ship.r/2, ship.r/2);
    ctx.lineTo(-ship.r/2, -ship.r/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // orbs with glow
    for (const o of orbs) {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r*3);
      orbGrad.addColorStop(0, 'rgba(255,255,0,0.8)');
      orbGrad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r,0,Math.PI*2); ctx.fill();
    }
    // obstacles with simple color
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r,0,Math.PI*2); ctx.fill();
    }
    // particles
    for (const p of particles) {
      const alpha = Math.max(p.life/30,0);
      ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgba','rgba');
      ctx.beginPath(); ctx.arc(p.x, p.y, 2,0,Math.PI*2); ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign='left'; ctx.fillText('Score: '+score,10,20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = '#f88'; ctx.textAlign = 'center'; ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', WIDTH/2, HEIGHT/2);
    }
  };
  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  loop();
})();
