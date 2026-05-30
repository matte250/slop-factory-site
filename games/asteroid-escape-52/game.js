// Simple Asteroid Escape game
// Assumes an HTML canvas with id="game" exists.
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioInitialized = false;
  function ensureAudio() {
    if (!audioInitialized && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioInitialized = true;
  }
  function playTone(freq, duration) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 10,
  };

  const keys = { left: false, right: false, up: false };
  const asteroids = [];
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp') keys.up = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp') keys.up = false;
  });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 30;
    // spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 0.5 + Math.random() * 1.0;
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -radius;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // right
        x = width + radius;
        y = Math.random() * height;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + radius;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      case 3: // left
        x = -radius;
        y = Math.random() * height;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    asteroids.push({ x, y, vx, vy, radius });
  }

  function update(dt) {
    if (gameOver) return;
    // handle ship controls
    if (keys.left) ship.angle -= 3 * dt;
    if (keys.right) ship.angle += 3 * dt;
if (keys.up) {
        const thrust = 100 * dt;
        ship.vx += Math.cos(ship.angle) * thrust;
        ship.vy += Math.sin(ship.angle) * thrust;
        // play thrust sound
        playTone(600, 0.03);
      }
    // apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // screen wrap
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // wrap
      if (a.x < -a.radius) a.x += width + 2 * a.radius;
      if (a.x > width + a.radius) a.x -= width + 2 * a.radius;
      if (a.y < -a.radius) a.y += height + 2 * a.radius;
      if (a.y > height + a.radius) a.y -= height + 2 * a.radius;
    }
    // collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        // play collision/explosion sound
        playTone(200, 0.5);
        gameOver = true;
        break;
      }
    }
    // spawn new asteroids periodically
    if (Math.random() < dt * 0.5) spawnAsteroid();
    // score based on time survived
    score += dt;
  }

  function draw() {
    // draw space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw ship with stroke and glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = '#00ffcc'; // bright ship color
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
    // draw asteroids
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  spawnAsteroid();
  requestAnimationFrame(loop);
})();
