// Simple "Pixel Dodge" game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Ensure canvas has dimensions
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 400;

  // Create simple starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5 + 0.5 });
  }

  // Sound setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// Background music (soft ambient tone)
let bgOscillator = null;
function startBackgroundMusic() {
  if (bgOscillator) return; // already started
  bgOscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  bgOscillator.type = 'sine';
  bgOscillator.frequency.value = 30; // low frequency hum
  bgOscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  bgOscillator.start();
}

// Start music after first interaction (handled in keydown)

const player = {
    size: 20,
    x: canvas.width / 2 - 10,
    y: canvas.height / 2 - 10,
    speed: 4,
    color: '#00ff00',
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  document.addEventListener('keydown', e => {
  if (e.key in keys) {
    // Ensure AudioContext is running (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Start background music on first interaction
    startBackgroundMusic();
    keys[e.key] = true;
    playBeep(400, 0.05);
  }
});
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms
  let startTime = null;
  let gameOver = false;

  function spawnAsteroid() {
    // Random edge position
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 15 + Math.random() * 10;
    const speed = 1 + Math.random() * 2;
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -size;
        break;
      case 1: // right
        x = canvas.width + size;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + size;
        break;
      case 3: // left
        x = -size;
        y = Math.random() * canvas.height;
        break;
    }
    // direction toward player
    const dx = player.x + player.size / 2 - x;
    const dy = player.y + player.size / 2 - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, size, color: '#ff0000' });
  }

  function update(delta) {
    // move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }

    // collision detection
    for (const a of asteroids) {
      const dx = a.x - (player.x + player.size / 2);
      const dy = a.y - (player.y + player.size / 2);
      const dist = Math.hypot(dx, dy);
if (dist < a.size / 2 + player.size / 2) {
          playBeep(200,0.3);
          gameOver = true;
          break;
        }
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // player with glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.restore();
    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size / 2);
      grad.addColorStop(0, 'rgba(255,200,200,0.9)');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score / time
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    if (!gameOver) {
      const delta = timestamp - (lastFrame ?? timestamp);
      update(delta);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame;
  requestAnimationFrame(loop);
})();
