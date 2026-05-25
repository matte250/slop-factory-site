// Gravity Escape – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  // audio context and simple beep helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // ---------- utilities ----------
  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ---------- game objects ----------
  // trail for ship
  const shipTrail = [];
  const maxTrail = 20;
  const ship = {
    x: W / 2,
    y: H / 2,
    vx: 0,
    vy: 0,
    r: 8,
    fuel: 100,
    thrust: 0.2,
update() {
        // record trail
        shipTrail.push({ x: this.x, y: this.y });
        if (shipTrail.length > maxTrail) shipTrail.shift();
      if (keys['ArrowUp'] && this.fuel > 0) {
        const angle = -Math.PI / 2; // upward thrust relative to screen
        this.vx += Math.cos(angle) * this.thrust;
        this.vy += Math.sin(angle) * this.thrust;
        this.fuel -= 0.3;
          // thrust sound
          beep(440, 'sawtooth', 0.05);
      }
      // apply gravity from planets
      planets.forEach(p => {
        const d = dist(this.x, this.y, p.x, p.y);
if (d < p.r) { // crash
           gameOver = true;
           beep(150, 'sine', 0.4);
         } else if (d < p.gRadius) {
          const g = (p.mass / (d * d)) * 0.5; // simple inverse‑square
          const dx = p.x - this.x;
          const dy = p.y - this.y;
          const nd = Math.hypot(dx, dy);
          this.vx += (dx / nd) * g;
          this.vy += (dy / nd) * g;
        }
      });
      this.x += this.vx;
      this.y += this.vy;
      // keep within bounds (wrap)
      if (this.x < 0) this.x += W;
      if (this.x > W) this.x -= W;
      if (this.y < 0) this.y += H;
      if (this.y > H) this.y -= H;
    },
draw() {
        // ship with glow gradient
        const grad = ctx.createRadialGradient(this.x, this.y, this.r / 4, this.x, this.y, this.r * 2);
        grad.addColorStop(0, '#0ff');
        grad.addColorStop(1, '#005');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
  };

  const planets = [];
  for (let i = 0; i < 5; i++) {
    const r = rand(20, 40);
    planets.push({
      x: rand(r, W - r),
      y: rand(r, H - r),
      r,
      mass: rand(2000, 5000),
      gRadius: r * 4
    });
  }

  const orbs = [];
// background stars for visual depth
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: rand(0, W),
    y: rand(0, H),
    r: rand(0.5, 1.5)
  });
}
  const spawnOrb = () => {
    const r = 4;
    orbs.push({
      x: rand(r, W - r),
      y: rand(r, H - r),
      r,
      collected: false
    });
    if (orbs.length < 10 && Math.random() < 0.02) spawnOrb();
  };
  spawnOrb();

  const keys = {};
  window.addEventListener('keydown', e => {
  keys[e.key] = true;
  // ensure audio context is running after user interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
  window.addEventListener('keyup', e => keys[e.key] = false);

  let score = 0;
  let gameOver = false;

  function update() {
    if (gameOver) return;
    ship.update();
    // collect orbs
    orbs.forEach(o => {
      if (!o.collected && dist(ship.x, ship.y, o.x, o.y) < ship.r + o.r) {
        o.collected = true;
        score++;
        spawnOrb();
      }
    });
    // fuel out
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ship trail (fading)
    shipTrail.forEach((pt, i) => {
      const t = i / shipTrail.length; // 0 oldest, 1 newest
      ctx.fillStyle = `rgba(0,255,255,${t * 0.5})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, ship.r * (0.5 + t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });

    // planets
    planets.forEach(p => {
      ctx.fillStyle = '#822';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // orbs
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => {
      if (!o.collected) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // ship
    ship.draw();
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
