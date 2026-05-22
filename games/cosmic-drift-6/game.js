// Minimal Cosmic Drift game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollect = () => playTone(800, 0.07);
  const playCrash = () => playTone(150, 0.3);

  // ----- Helpers -----
  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ----- Game objects -----
  const ship = {
    x: W / 2,
    y: H / 2,
    r: 10,
    angle: 0,
    speed: 2,
    vx: 0,
    vy: 0,
    trail: [], // recent positions for motion blur
    update() {
      // simple steering with arrow keys
      if (keys.ArrowLeft) this.angle -= 0.07;
      if (keys.ArrowRight) this.angle += 0.07;
      if (keys.ArrowUp) {
        this.vx += Math.cos(this.angle) * 0.1;
        this.vy += Math.sin(this.angle) * 0.1;
      }
      // constant forward drift
      this.x += this.vx + Math.cos(this.angle) * this.speed;
      this.y += this.vy + Math.sin(this.angle) * this.speed;
      // wrap bounds
      if (this.x < 0) this.x += W;
      if (this.x > W) this.x -= W;
      if (this.y < 0) this.y += H;
      if (this.y > H) this.y -= H;
      // record trail
      this.trail.push({ x: this.x, y: this.y, life: 20 });
      // decay trail
      this.trail = this.trail.filter(p => {
        p.life--;
        return p.life > 0;
      });
    },
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // ship with gradient and glow
      const grad = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(this.r, 0);
      ctx.lineTo(-this.r, this.r / 2);
      ctx.lineTo(-this.r, -this.r / 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  };

  const asteroids = [];
  const orbs = [];
  let score = 0;
  let gameOver = false;
  const keys = {};
  // precompute star positions for stable background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, W), y: rand(0, H) });
  }

  // ----- Spawn helpers -----
  const spawnAsteroid = () => {
    const edge = Math.floor(rand(0, 4)); // 0:top 1:right 2:bottom 3:left
    let x, y, vx, vy;
    const size = rand(15, 30);
    switch (edge) {
      case 0: x = rand(0, W); y = -size; vx = rand(-0.5, 0.5); vy = rand(0.5, 1.5); break;
      case 1: x = W + size; y = rand(0, H); vx = rand(-1.5, -0.5); vy = rand(-0.5, 0.5); break;
      case 2: x = rand(0, W); y = H + size; vx = rand(-0.5, 0.5); vy = rand(-1.5, -0.5); break;
      case 3: x = -size; y = rand(0, H); vx = rand(0.5, 1.5); vy = rand(-0.5, 0.5); break;
    }
    asteroids.push({x, y, vx, vy, r: size});
  };

  const spawnOrb = () => {
    const x = rand(20, W - 20);
    const y = rand(20, H - 20);
    orbs.push({x, y, r: 5});
  };

  // prepopulate
  for (let i = 0; i < 5; i++) spawnAsteroid();
  for (let i = 0; i < 3; i++) spawnOrb();

  // ----- Input -----
  window.addEventListener('keydown', e => {
    resumeAudio();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Main loop -----
  function loop() {
    if (gameOver) return;
    // background stars
    // background with subtle trailing effect
    ctx.fillStyle = 'rgba(0, 0, 20, 0.3)';
    ctx.fillRect(0, 0, W, H);
    // draw static stars (precomputed) as tiny glows
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw ship trail (motion blur)
    ctx.globalCompositeOperation = 'lighter';
    ship.trail.forEach(p => {
      ctx.beginPath();
      const alpha = p.life / 20;
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.arc(p.x, p.y, ship.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    ship.update();
    ship.draw();

    // asteroids with gradient shading
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      // wrap
      if (a.x < -a.r) a.x = W + a.r;
      if (a.x > W + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = H + a.r;
      if (a.y > H + a.r) a.y = -a.r;
      // radial gradient for depth effect
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      // collision
      if (dist(ship.x, ship.y, a.x, a.y) < ship.r + a.r) {
        playCrash();
        gameOver = true;
      }
    });

    // orbs
    ctx.fillStyle = '#ff0';
    orbs.forEach((o, i) => {
      const grad = ctx.createRadialGradient(o.x, o.y, o.r * 0.2, o.x, o.y, o.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      // reset fillStyle for potential later uses
      ctx.fillStyle = '#ff0';
      if (dist(ship.x, ship.y, o.x, o.y) < ship.r + o.r) {
        playCollect();
        score++;
        ship.speed += 0.1; // increase speed slightly
        orbs.splice(i, 1);
        spawnOrb();
      }
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // spawn new obstacles over time
    if (Math.random() < 0.01) spawnAsteroid();
    if (Math.random() < 0.005) spawnOrb();

    requestAnimationFrame(loop);
  }

  loop();

  // Game over overlay
  const overlay = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', W / 2, H / 2 - 20);
    ctx.fillText('Score: ' + score, W / 2, H / 2 + 10);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press R to Restart', W / 2, H / 2 + 40);
  };

  window.addEventListener('keydown', e => {
    if (gameOver && e.key.toLowerCase() === 'r') {
      // reset
      ship.x = W / 2; ship.y = H / 2; ship.vx = ship.vy = 0; ship.angle = 0; ship.speed = 2;
      asteroids.length = 0; orbs.length = 0; score = 0; gameOver = false;
      for (let i = 0; i < 5; i++) spawnAsteroid();
      for (let i = 0; i < 3; i++) spawnOrb();
      loop();
    }
  });

  // render overlay when game over
  (function watch() {
    if (gameOver) overlay();
    requestAnimationFrame(watch);
  })();
})();
