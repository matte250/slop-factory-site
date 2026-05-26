// Game: Starship Dodge
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Background hum
  setInterval(() => playTone(60, 0.2), 3000);
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
// Generate simple star field background
const stars = Array.from({ length: 120 }, () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  r: Math.random() * 1.5 + 0.5,
}));

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 40,
    w: 30,
    h: 30,
    speed: 4,
    color: '#0ff',
    shield: 100,
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    ship.y = e.clientY - rect.top;
  });

  const obstacles = [];
  let frame = 0;
  const spawnRate = () => Math.max(30, 120 - Math.floor(frame / 300)); // faster over time
  const obstacleSpeed = () => 2 + Math.floor(frame / 600);

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      color: '#f44',
    });
  }

  function update() {
    // Move ship via arrow keys if mouse not moved
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // Keep ship within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn obstacles
    if (frame % spawnRate() === 0) spawnObstacle();

    // Move obstacles
    for (const o of obstacles) o.y += obstacleSpeed();
    // Remove off-screen obstacles
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();

    // Move stars for parallax effect
    for (const s of stars) {
      s.y += 0.5; // slow drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        ship.shield -= 20;
        // collision sound
        playTone(400, 0.1);
        // Remove collided obstacle
        obstacles.splice(obstacles.indexOf(o), 1);
        break;
      }
    }

    // Game over
    if (ship.shield <= 0) {
      cancelAnimationFrame(animId);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      return;
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw moving stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Obstacles as circles with glow
    for (const o of obstacles) {
      const grad = ctx.createRadialGradient(o.x + o.w / 2, o.y + o.h / 2, 0, o.x + o.w / 2, o.y + o.h / 2, o.w / 2);
      grad.addColorStop(0, 'rgba(255,0,0,0.8)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shield bar with red background
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 200, 10);
    ctx.fillStyle = 'lime';
    ctx.fillRect(10, 10, ship.shield * 2, 10);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 10, 200, 10);
  }

  function loop() {
    frame++;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }
  let animId = requestAnimationFrame(loop);
})();
