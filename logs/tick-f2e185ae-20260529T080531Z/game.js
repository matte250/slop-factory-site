// Simple Orbit Escape game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq = 440, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playExplosion() {
    const bufferSize = audioCtx.sampleRate * 0.2;
    const noiseBuf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
  }
  const w = (canvas.width = canvas.clientWidth);
  const h = (canvas.height = canvas.clientHeight);
  // Starfield setup
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      brightness: Math.random() * 0.5 + 0.5,
    });
  }

  const center = { x: w / 2, y: h / 2 };
  const planet = { r: 30 };
  const ship = {
    angle: 0,
    radius: 120,
    innerRadius: 80,
    outerRadius: 140,
    size: 8,
    speed: 0.02,
  };
  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms
  let gameOver = false;

  function spawnAsteroid() {
    // Choose random edge
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1.2 + Math.random() * 0.5;
    if (side === 0) {
      // top
      x = Math.random() * w;
      y = -10;
    } else if (side === 1) {
      // right
      x = w + 10;
      y = Math.random() * h;
    } else if (side === 2) {
      // bottom
      x = Math.random() * w;
      y = h + 10;
    } else {
      // left
      x = -10;
      y = Math.random() * h;
    }
    // Vector towards center
    const dx = center.x - x;
    const dy = center.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, r: 6, color: '#'+Math.floor(Math.random()*16777215).toString(16) });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship orbit
    ship.angle += ship.speed * dt;
    // Toggle radius on input handled elsewhere
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Remove if near center
      if (Math.hypot(a.x - center.x, a.y - center.y) < planet.r) {
        playExplosion();
        gameOver = true;
        return;
      }
      // Collision with ship
      const shipPos = {
        x: center.x + Math.cos(ship.angle) * ship.radius,
        y: center.y + Math.sin(ship.angle) * ship.radius,
      };
      if (Math.hypot(a.x - shipPos.x, a.y - shipPos.y) < a.r + ship.size) {
        gameOver = true;
        return;
      }
    }
    // Spawn new asteroid
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.globalAlpha = s.brightness;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(center.x, center.y, planet.r * 0.2, center.x, center.y, planet.r);
    planetGrad.addColorStop(0, '#6b8e23');
    planetGrad.addColorStop(1, '#2b3b4b');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planet.r, 0, Math.PI * 2);
    ctx.fill();

    // Ship as triangle pointing forward
    const shipPos = {
      x: center.x + Math.cos(ship.angle) * ship.radius,
      y: center.y + Math.sin(ship.angle) * ship.radius,
    };
    const dir = ship.angle;
    const tip = { x: shipPos.x + Math.cos(dir) * ship.size * 2, y: shipPos.y + Math.sin(dir) * ship.size * 2 };
    const left = { x: shipPos.x + Math.cos(dir + Math.PI * 0.75) * ship.size, y: shipPos.y + Math.sin(dir + Math.PI * 0.75) * ship.size };
    const right = { x: shipPos.x + Math.cos(dir - Math.PI * 0.75) * ship.size, y: shipPos.y + Math.sin(dir - Math.PI * 0.75) * ship.size };
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();

    // Asteroids with varied colors
    asteroids.forEach(a => {
      ctx.fillStyle = a.color || '#888';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }
    ctx.clearRect(0, 0, w, h);
    // Planet
    ctx.fillStyle = '#2b3b4b';
    ctx.beginPath();
    ctx.arc(center.x, center.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // Ship
    const shipPos = {
      x: center.x + Math.cos(ship.angle) * ship.radius,
      y: center.y + Math.sin(ship.angle) * ship.radius,
    };
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(shipPos.x, shipPos.y, ship.size, 0, Math.PI * 2);
    ctx.fill();
    // Asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 16; // normalize to ~60fps steps
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input: space or click toggles between inner and outer orbit radius
  function toggleRadius() {
    // Ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    playBeep(600, 0.07);
    ship.radius = ship.radius === ship.innerRadius ? ship.outerRadius : ship.innerRadius;
    ship.radius = ship.radius === ship.innerRadius ? ship.outerRadius : ship.innerRadius;
  }
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') toggleRadius();
  });
  canvas.addEventListener('click', toggleRadius);

  // Start
  requestAnimationFrame(loop);
})();
