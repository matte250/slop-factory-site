// Orbit Escape – concise canvas game
// Canvas element assumed: <canvas id="game"></canvas>
(() => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Helper to play a beep at given frequency and duration
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { beep(440, 50); }
  function playCollision() { beep(100, 300); }
  function playCollect() { beep(660, 100); }
  function playGameOver() { beep(200, 500); }
  // Ensure audio context resumes on first user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth;
  const HEIGHT = canvas.height = canvas.clientHeight;
  const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };

  // Ship state
  const ship = {
    x: CENTER.x,
    y: CENTER.y - 50,
    r: 10,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotSpeed: 0.07,
    fuel: 100,
  };

  // Game objects
  const debris = [];
  const fuelCells = [];
  let score = 0;
  let gameOver = false;
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, r: Math.random() * 1.5 + 0.5 });
}
const particles = [];

  // Utility helpers
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Populate obstacles and fuel
  for (let i = 0; i < 15; i++) {
    debris.push({ x: rand(0, WIDTH), y: rand(0, HEIGHT), r: rand(8, 15) });
  }
  for (let i = 0; i < 8; i++) {
    fuelCells.push({ x: rand(0, WIDTH), y: rand(0, HEIGHT), r: 6, collected: false });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update() {
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
    if (gameOver) return;
    // Rotation
    if (keys.ArrowLeft) ship.angle -= ship.rotSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotSpeed;
    // Thrust
    if (keys.ArrowUp && ship.fuel > 0) {
      playThrust();
      // Generate thrust particles
      const angle = ship.angle + Math.PI; // opposite direction
      const px = ship.x + Math.cos(angle) * ship.r;
      const py = ship.y + Math.sin(angle) * ship.r;
      particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * (Math.random() * 0.5 + 0.5),
        vy: Math.sin(angle) * (Math.random() * 0.5 + 0.5),
        life: 20,
        size: Math.random() * 2 + 1,
        color: 'rgba(255,165,0,0.8)'
      });
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel -= 0.2;
    }
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel -= 0.2;
    }
    // Gravity toward center
    const dx = CENTER.x - ship.x;
    const dy = CENTER.y - ship.y;
    const distToCenter = Math.hypot(dx, dy);
    const gravity = 0.02 * (distToCenter / Math.max(WIDTH, HEIGHT));
    ship.vx += (dx / distToCenter) * gravity;
    ship.vy += (dy / distToCenter) * gravity;
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap around edges
    if (ship.x < 0) ship.x += WIDTH;
    if (ship.x > WIDTH) ship.x -= WIDTH;
    if (ship.y < 0) ship.y += HEIGHT;
    if (ship.y > HEIGHT) ship.y -= HEIGHT;
    // Collision with debris
    for (const d of debris) {
if (dist(ship, d) < ship.r + d.r) {
          playCollision();
          gameOver = true;
          break;
        }
    }
    // Collect fuel cells
    for (const f of fuelCells) {
if (!f.collected && dist(ship, f) < ship.r + f.r) {
          f.collected = true;
          ship.fuel = Math.min(ship.fuel + 30, 100);
          score += 10;
          playCollect();
        }
    }
    // Lose if out of fuel
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw particles (thrust)
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
// Planet (center) with gradient aura and glow
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#4ca1af';
  const planetGrad = ctx.createRadialGradient(CENTER.x, CENTER.y, 10, CENTER.x, CENTER.y, 30);
  planetGrad.addColorStop(0, '#4ca1af');
  planetGrad.addColorStop(1, '#2c3e50');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Debris
    ctx.fillStyle = '#c0392b';
    for (const d of debris) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel cells
    ctx.fillStyle = '#27ae60';
    for (const f of fuelCells) {
      if (f.collected) continue;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
