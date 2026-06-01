// Game based on IDEA.md – Asteroid Dash with enhanced graphics
// Canvas with id="game" expected in the host HTML

(() => {
  // Create starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  window.addEventListener('keydown', () => { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } }, {once:true});
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  let overSoundPlayed = false;
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);


  // Ship – a simple triangle
  const ship = {
    x: width * 0.1,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.07,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const asteroids = [];
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: width + size,
      y: Math.random() * height,
      vx: -(Math.random() * 1 + 0.5),
      size,
    });
  }

  function update(dt) {
    // controls
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // play thrust sound
      playTone(600, 0.05);
    }
    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // screen wrap for ship
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // spawn asteroids over time, speed up
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // gradually increase difficulty
      if (spawnInterval > 500) spawnInterval -= 20;
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * (1 + (performance.now() - startTime) / 60000); // speed up over time
      if (a.x < -a.size) asteroids.splice(i, 1);
      // collision (approximate ship as circle)
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.radius) {
        gameOver = true;
        // play collision sound
        playTone(200, 0.3);
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // asteroids
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }
    drawShip();
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${seconds}s`, 10, 20);
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  requestAnimationFrame(loop);
})();
