// Minimal Orbit Dodge game
// Canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // resume audio on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Resize canvas and generate background stars
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // generate starfield
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  let stars = [];
  resize();
  window.addEventListener('resize', resize);

  const center = { x: () => canvas.width / 2, y: () => canvas.height / 2 };
  const planetRadius = 30;
  const ship = {
    radius: 10,
    orbit: 80,
    angle: 0,
    speed: 0.03, // rad per frame when key pressed
    color: '#0ff',
  };
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', (e) => { if (e.code in keys) keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { if (e.code in keys) keys[e.code] = false; });

  const asteroids = [];
  const asteroidSpawnRate = 120; // frames
  let frameCount = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(canvas.width, canvas.height) / 2 + 20;
    const speed = 1 + Math.random() * 1.5;
    asteroids.push({
      angle,
      distance,
      speed,
      radius: 8 + Math.random() * 6,
      color: '#f55',
    });
    // sound for new asteroid
    playTone(220, 0.08);
  }

  function update() {
    if (gameOver) return;
    // ship rotation
    if (keys.ArrowLeft) ship.angle -= ship.speed;
    if (keys.ArrowRight) ship.angle += ship.speed;
    // update asteroids
    for (let a of asteroids) {
      a.distance -= a.speed;
    }
    // remove passed asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].distance < planetRadius) asteroids.splice(i, 1);
    }
    // spawn
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
    // collision detection
    const shipPos = {
      x: center.x() + Math.cos(ship.angle) * ship.orbit,
      y: center.y() + Math.sin(ship.angle) * ship.orbit,
    };
    for (let a of asteroids) {
      const ax = center.x() + Math.cos(a.angle) * a.distance;
      const ay = center.y() + Math.sin(a.angle) * a.distance;
      const dx = ax - shipPos.x;
      const dy = ay - shipPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // collision sound
        playTone(100, 0.2);
        gameOver = true;
        break;
      }
    }
    frameCount++;
  }

function draw() {
  // clear background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw starfield background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // planet with radial gradient
  const cx = center.x();
  const cy = center.y();
  const grad = ctx.createRadialGradient(cx, cy, planetRadius * 0.2, cx, cy, planetRadius);
  grad.addColorStop(0, '#884');
  grad.addColorStop(1, '#322');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, planetRadius, 0, Math.PI * 2);
  ctx.fill();
  // ship (triangle) with glow
  const sx = cx + Math.cos(ship.angle) * ship.orbit;
  const sy = cy + Math.sin(ship.angle) * ship.orbit;
  ctx.save();
  ctx.shadowColor = ship.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  const tip = { x: sx + Math.cos(ship.angle) * ship.radius, y: sy + Math.sin(ship.angle) * ship.radius };
  const left = { x: sx + Math.cos(ship.angle + Math.PI * 0.75) * ship.radius, y: sy + Math.sin(ship.angle + Math.PI * 0.75) * ship.radius };
  const right = { x: sx + Math.cos(ship.angle - Math.PI * 0.75) * ship.radius, y: sy + Math.sin(ship.angle - Math.PI * 0.75) * ship.radius };
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // asteroids with simple shading
  for (let a of asteroids) {
    const ax = cx + Math.cos(a.angle) * a.distance;
    const ay = cy + Math.sin(a.angle) * a.distance;
    const gradA = ctx.createRadialGradient(ax, ay, a.radius * 0.3, ax, ay, a.radius);
    gradA.addColorStop(0, '#faa');
    gradA.addColorStop(1, '#800');
    ctx.fillStyle = gradA;
    ctx.beginPath();
    ctx.arc(ax, ay, a.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  // game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
