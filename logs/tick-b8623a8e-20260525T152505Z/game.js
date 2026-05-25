// Minimal endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const cw = (canvas.width = canvas.clientWidth);
  const ch = (canvas.height = canvas.clientHeight);

  // ship
  const ship = { x: cw / 2, y: ch - 30, w: 20, h: 20, speed: 5 };
  let fuel = 100;

  // input
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // stars background (glowing points)
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * cw,
    y: Math.random() * ch,
    s: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.3 + 0.1,
    hue: Math.random() * 360,
  }));

  // particles for ship thrust
  const particles = [];

  // asteroids
  let asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms

  function spawnAsteroid() {
    const size = Math.random() * 20 + 20;
    asteroids.push({
      x: Math.random() * (cw - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 2,
    });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  let gameOver = false;

  function update(dt) {
    // fuel drain
    fuel -= dt * 0.02;
    if (fuel <= 0) { fuel = 0; gameOver = true; playBeep(100, 300); }
    // ship movement
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(cw - ship.w, ship.x));
    // thrust particles while moving
if (keys.left || keys.right) {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: ship.x + ship.w / 2,
          y: ship.y + ship.h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.5 + Math.random() * 0.5,
          life: 300,
          size: Math.random() * 2 + 1,
          hue: Math.random() * 360,
        });
      }
      playBeep(440, 100); // thrust sound
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
