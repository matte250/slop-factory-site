// Meteor Dodge game – targets <canvas id="game"></canvas>
// Simple arcade: ship (triangle) moves left/right, meteors fall, score based on time.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
  }

  // Ship
  const ship = { w: 30, h: 40, x: width / 2, y: height - 50, speed: 5 };
  // Input handling
const keys = {};
window.addEventListener('keydown', e => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Meteors array
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  const maxSpeed = 4;

  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration / 1000);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000 - 0.01);
}

function spawnMeteor() {
  // Play a short beep when a meteor appears
  playBeep(600, 80);

    const radius = Math.random() * 15 + 10;
    meteors.push({ x: Math.random() * (width - 2 * radius) + radius, y: -radius, r: radius, v: Math.random() * maxSpeed + 1 });
  }

  let lastMoveSound = 0;
function update(dt) {
    // Ship movement
    let moved = false;
    if (keys.ArrowLeft || keys.a) { ship.x -= ship.speed; moved = true; }
    if (keys.ArrowRight || keys.d) { ship.x += ship.speed; moved = true; }
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));
    if (moved && performance.now() - lastMoveSound > 100) { playBeep(400, 50); lastMoveSound = performance.now(); }

    // Update stars for parallax background
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    // Meteors
    meteors.forEach(m => m.y += m.v);
    // Remove off‑screen meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].y - meteors[i].r > height) meteors.splice(i, 1);
    }
    // Spawn new meteors
    if (performance.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }
    // Collision
    for (const m of meteors) {
      const dx = m.x - ship.x;
      const dy = m.y - (ship.y - ship.h / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < m.r + ship.w / 2) { playBeep(200, 200); gameOver = true; break; }
    }
    if (!gameOver) score += dt * 0.01; // increase score over time
  }

  function drawStars() {
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#000010');
    grad.addColorStop(1, '#000030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function drawShip() {
    // Ship with gradient fill and white stroke
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.h / 2, ship.x, ship.y + ship.h / 2);
    grad.addColorStop(0, '#00ff00');
    grad.addColorStop(1, '#007700');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }


  function drawMeteors() {
    ctx.fillStyle = '#a52a2a';
    meteors.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawStars();
    if (!gameOver) {
      update(dt);
      drawShip();
      drawMeteors();
      drawScore();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      drawScore();
    }
  }

  requestAnimationFrame(loop);
})();
