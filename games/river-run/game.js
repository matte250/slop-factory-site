// Simple River Run game implementation
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Background water flow sound (continuous low hum)
  const waterGain = audioCtx.createGain();
  waterGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  const waterOsc = audioCtx.createOscillator();
  waterOsc.frequency.value = 80;
  waterOsc.type = 'sine';
  waterOsc.connect(waterGain).connect(audioCtx.destination);
  waterOsc.start();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;

  // Boat configuration
  const boat = {
    width: 40,
    height: 20,
    x: W / 2 - 20,
    y: H - 60,
    speed: 4,
    color: '#ff9800',
  };

  // Obstacle configuration
  const obstacles = [];
  const obstacleTypes = [
    { w: 30, h: 30, color: '#777' }, // rock
    { w: 50, h: 20, color: '#8b4513' }, // log
    { w: 40, h: 40, color: '#0066ff' }, // whirlpool
  ];

  let speed = 2; // river scroll speed
  let frames = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const x = Math.random() * (W - type.w);
    obstacles.push({ x, y: -type.h, w: type.w, h: type.h, color: type.color });
  }

  function update() {
    if (gameOver) return;
    // Move boat
    if (keys.ArrowLeft) boat.x -= boat.speed;
    if (keys.ArrowRight) boat.x += boat.speed;
    if (keys.ArrowUp) boat.y -= boat.speed;
    if (keys.ArrowDown) boat.y += boat.speed;
    // keep inside canvas
    boat.x = Math.max(0, Math.min(W - boat.width, boat.x));
    boat.y = Math.max(0, Math.min(H - boat.height, boat.y));

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.y += speed;
      // collision detection
      if (
        boat.x < obs.x + obs.w &&
        boat.x + boat.width > obs.x &&
        boat.y < obs.y + obs.h &&
        boat.y + boat.height > obs.y
      ) {
        gameOver = true;
        beep(200, 0.3); // collision sound
        alert('Game Over!');
        return;
      }
      // Remove off‑screen obstacles
      if (obs.y > H) obstacles.splice(i, 1);
    }

    // Spawn new obstacles periodically
    if (frames % 120 === 0) {
      spawnObstacle();
      beep(400, 0.05); // obstacle spawn sound
    }

    // Increase speed gradually
    if (frames % 600 === 0) speed += 0.2;
    frames++;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Draw river background with vertical gradient
    const riverGrad = ctx.createLinearGradient(0, 0, 0, H);
    riverGrad.addColorStop(0, '#66c2ff'); // lighter upstream
    riverGrad.addColorStop(1, '#0044aa'); // deeper downstream
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw boat as a simple triangle
    ctx.fillStyle = boat.color;
    ctx.beginPath();
    ctx.moveTo(boat.x, boat.y + boat.height);
    ctx.lineTo(boat.x + boat.width / 2, boat.y);
    ctx.lineTo(boat.x + boat.width, boat.y + boat.height);
    ctx.closePath();
    ctx.fill();

    // Draw obstacles with varied shapes
    for (const obs of obstacles) {
      if (obs.w === obs.h) {
        // Square-ish: draw as circle (rock or whirlpool)
        const radial = ctx.createRadialGradient(
          obs.x + obs.w / 2,
          obs.y + obs.h / 2,
          obs.w * 0.1,
          obs.x + obs.w / 2,
          obs.y + obs.h / 2,
          obs.w / 2
        );
        radial.addColorStop(0, obs.color);
        radial.addColorStop(1, '#000');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Rectangular log: rounded rectangle
        ctx.fillStyle = obs.color;
        const radius = 5;
        ctx.beginPath();
        ctx.moveTo(obs.x + radius, obs.y);
        ctx.lineTo(obs.x + obs.w - radius, obs.y);
        ctx.quadraticCurveTo(obs.x + obs.w, obs.y, obs.x + obs.w, obs.y + radius);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h - radius);
        ctx.quadraticCurveTo(obs.x + obs.w, obs.y + obs.h, obs.x + obs.w - radius, obs.y + obs.h);
        ctx.lineTo(obs.x + radius, obs.y + obs.h);
        ctx.quadraticCurveTo(obs.x, obs.y + obs.h, obs.x, obs.y + obs.h - radius);
        ctx.lineTo(obs.x, obs.y + radius);
        ctx.quadraticCurveTo(obs.x, obs.y, obs.x + radius, obs.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game when the page loads
  window.addEventListener('load', () => requestAnimationFrame(loop));
})();
