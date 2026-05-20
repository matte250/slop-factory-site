// Simple Space Drone game targeting <canvas id="game"></canvas>
// Pilot the drone, collect energy orbs, avoid asteroids. Power drains over time.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio can start after user interaction
  const resumeAudio = () => audioCtx.state === 'suspended' && audioCtx.resume();
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Continuous low drone background
  let bgOsc;
  function startBackground() {
    bgOsc = audioCtx.createOscillator();
    const bgGain = audioCtx.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 30; // low hum
    bgGain.gain.setValueAtTime(0.002, audioCtx.currentTime);
    bgOsc.connect(bgGain).connect(audioCtx.destination);
    bgOsc.start();
  }
  startBackground();

  // Low power warning beep
  let lowPowerWarned = false;
  function lowPowerBeep() {
    if (lowPowerWarned) return;
    lowPowerWarned = true;
    playTone(400, 'square', 0.2);
    setTimeout(() => { lowPowerWarned = false; }, 2000);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- utilities -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- player -----
  const player = {
    x: width / 2,
    y: height / 2,
    r: 12,
    speed: 2.5,
    vx: 0,
    vy: 0,
    color: '#0ff',
  };
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- stars (background) -----
  const stars = new Array(100).fill().map(() => ({
    x: rand(0, width),
    y: rand(0, height),
    z: rand(0.2, 1),
    b: Math.random() * 0.8 + 0.2, // brightness 0.2-1.0
  }));
  const drawStars = () => {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      const sx = (s.x - player.x) * s.z + width / 2;
      const sy = (s.y - player.y) * s.z + height / 2;
      if (sx < 0 || sx > width || sy < 0 || sy > height) return;
      const size = s.z * 2;
      ctx.globalAlpha = s.b; // use brightness for twinkling
      ctx.fillRect(sx, sy, size, size);
      ctx.globalAlpha = 1;
      // move star opposite to player motion for parallax
      s.x -= player.vx * 0.5;
      s.y -= player.vy * 0.5;
      // wrap around
      if (s.x < -width) s.x += width * 2;
      if (s.x > width) s.x -= width * 2;
      if (s.y < -height) s.y += height * 2;
      if (s.y > height) s.y -= height * 2;
    });
  };

  // ----- energy orbs -----
  const orbs = [];
  const spawnOrb = () => {
    orbs.push({
      x: rand(0, width),
      y: rand(0, height),
      r: 8,
      color: '#ff0',
    });
  };
  // spawn initial orbs
  for (let i = 0; i < 5; i++) spawnOrb();

  // ----- asteroids -----
  const asteroids = [];
  const spawnAsteroid = () => {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.5, 1.5);
    asteroids.push({
      x: rand(0, width),
      y: rand(0, height),
      r: rand(15, 30),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: '#888',
    });
  };
  // spawn some asteroids initially
  for (let i = 0; i < 3; i++) spawnAsteroid();

  // ----- power meter -----
  let power = 100; // 0-100
  const powerDrainRate = 0.05; // per frame
  const powerPerOrb = 15;

  // ----- main loop -----
  function update() {
    // input handling
    player.vx = player.vy = 0;
    if (keys['ArrowUp'] || keys['w']) player.vy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.vy = player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.vx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.vx = player.speed;

    // move player
    player.x = (player.x + player.vx + width) % width;
    player.y = (player.y + player.vy + height) % height;

    // drain power
    power = Math.max(0, power - powerDrainRate);
    if (power < 20) lowPowerBeep();
    // check orb collisions
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (dist(player, o) < player.r + o.r) {
        power = Math.min(100, power + powerPerOrb);
        orbs.splice(i, 1);
        spawnOrb(); // keep count constant
        playTone(600, 'sine', 0.1); // orb collect sound
      }
    }

    // move asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      // wrap around
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    });

    // asteroid collision
    for (const a of asteroids) {
      if (dist(player, a) < player.r + a.r) {
        power = 0; // immediate game over
        playTone(200, 'sawtooth', 0.3); // crash sound
      }
    }

    // random spawns over time
    if (Math.random() < 0.005) spawnAsteroid();
    if (Math.random() < 0.01) spawnOrb();
  }

  function draw() {
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    drawStars();

    // draw energy orbs with glow
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw asteroids with subtle shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw player drone with cyan glow
    const pGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r);
    pGrad.addColorStop(0, '#0ff');
    pGrad.addColorStop(1, '#008');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // draw power bar
    const barWidth = 100;
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 10, barWidth, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, (power / 100) * barWidth, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, barWidth, 10);
  }

  function loop() {
    update();
    draw();
    if (power > 0) {
      requestAnimationFrame(loop);
    } else {
      // game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // start the game
  loop();
})();
