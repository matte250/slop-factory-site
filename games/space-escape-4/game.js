// Simple Space Escape game
// Canvas with id "game" expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };

  // Asteroids
  const asteroids = [];
  const asteroidCount = 20;
  const maxSpeed = 1.5;
  for (let i = 0; i < asteroidCount; i++) {
    const size = 15 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * maxSpeed,
      vy: (Math.random() - 0.5) * maxSpeed,
      radius: size,
    });
  }

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  let distance = 0;
  let lastTime = performance.now();
  let thrusting = false;
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure context is resumed on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    canvas.removeEventListener('pointerdown', resumeAudio);
  };
  canvas.addEventListener('pointerdown', resumeAudio);

  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };

  const playThrust = () => playTone(400, 100);
  const playExplosion = () => playTone(120, 500);


  const thrustPower = 0.1;
  const rotateSpeed = 0.07;

  const drawShip = () => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Thrust flame
    if (thrusting) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  };

  const drawStars = () => {
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawAsteroids = () => {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const update = (dt) => {
    // Ship rotation handled by pointer move
    if (thrusting) {
      ship.vx += Math.cos(ship.angle) * thrustPower;
      ship.vy += Math.sin(ship.angle) * thrustPower;
      playThrust();
    }
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    });

    // Check collisions
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        // Game over – stop animation loop
        cancelAnimationFrame(animId);
        playExplosion();
      alert('Game Over! Score: ' + Math.floor(distance));
        return true;
      }
    }
    distance += Math.hypot(ship.vx, ship.vy) * dt;
    return false;
  };

  const render = () => {
    // Space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    drawStars();
    // Asteroids
    drawAsteroids();
    // Ship
    drawShip();
    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(distance), 10, 20);
  };

  let animId;
  const loop = (now) => {
    const dt = (now - lastTime) / 16; // normalise to ~60fps units
    lastTime = now;
    const gameOver = update(dt);
    if (gameOver) return;
    render();
    animId = requestAnimationFrame(loop);
  };

  // Input handling – click/tap for thrust, move pointer to rotate
  canvas.addEventListener('pointerdown', (e) => { thrusting = true; });
  canvas.addEventListener('pointerup', (e) => { thrusting = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pressure === 0 && e.buttons === 0) return; // ignore when not pressing
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - ship.x;
    const dy = my - ship.y;
    ship.angle = Math.atan2(dy, dx);
  });

  // Start the loop
  requestAnimationFrame(loop);
})();
