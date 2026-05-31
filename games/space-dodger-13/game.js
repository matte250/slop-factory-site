// Simple Space Dodger game
// Canvas element with id="game" expected in HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    osc.stop(audioCtx.currentTime + duration);
  }
  // ensure audio context is resumed on first user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('mousedown', resumeAudio);

  // Ship (triangle shape)
  const ship = { x: width / 2, y: height - 30, size: 20, speed: 4 };
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) { keys[e.key] = true; playTone(440, 0.05); } });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 1500; // ms
  let lastTime = 0;
  let speedFactor = 1;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size);
    const y = -size;
    const speed = 1.5 * speedFactor + Math.random();
    const rotation = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.02; // small spin
    asteroids.push({ x, y, size, speed, rotation, rotationSpeed });
    // sound for new asteroid
    playTone(300 + Math.random() * 200, 0.03);
  }

  function update(dt) {
    // move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep within bounds (triangle centered)
    ship.x = Math.max(ship.size/2, Math.min(width - ship.size/2, ship.x));

    // spawn asteroids over time
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnAsteroid();
      // gradually increase difficulty
      if (spawnInterval > 400) spawnInterval -= 20;
      speedFactor += 0.01;
    }

    // update asteroids (position + rotation)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.rotation += a.rotationSpeed;
      // remove off-screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // update stars for simple parallax drift
    for (const s of stars) {
      s.y += 0.1; // slow downward motion
      if (s.y > height) s.y = 0;
    }

    // collision detection
    for (const a of asteroids) {
      const shipRect = { x: ship.x - ship.size / 2, y: ship.y, w: ship.size, h: ship.size };
      const ax = a.x + a.size / 2;
      const ay = a.y + a.size / 2;
      // simple circle-rect collision
      const closestX = Math.max(shipRect.x, Math.min(ax, shipRect.x + shipRect.w));
      const closestY = Math.max(shipRect.y, Math.min(ay, shipRect.y + shipRect.h));
      const dx = ax - closestX;
      const dy = ay - closestY;
      if (dx * dx + dy * dy < (a.size / 2) ** 2) {
        gameOver = true;
        // explosion sound
        playTone(150, 0.4);
        break;
      }
    }

    // update score
    if (!gameOver) score = Math.floor((Date.now() - startTime) / 1000);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    // background stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    // asteroids with gradient and rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.rotation);
      const grad = ctx.createRadialGradient(
        0,
        0,
        a.size * 0.1,
        0,
        0,
        a.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Score: ${score}s`, width / 2, height / 2 + 30);
    }
  }

  let startTime = 0;
  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game when the page is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    requestAnimationFrame(loop);
  } else {
    window.addEventListener('DOMContentLoaded', () => requestAnimationFrame(loop));
  }
})();
