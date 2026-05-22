// Simple Asteroid Miner game targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, dur);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  const ship = { x: width / 2, y: height / 2, r: 15, speed: 3, vx: 0, vy: 0 };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

  const ores = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnOre() {
    ores.push({ x: rand(0, width), y: rand(0, height), r: 8, collected: false });
  }

  function spawnAsteroid() {
    const moveAngle = rand(0, Math.PI * 2);
    const speed = rand(1, 2.5);
    const rotSpeed = rand(-0.02, 0.02);
    asteroids.push({
      x: rand(0, width),
      y: rand(0, height),
      r: rand(20, 35),
      vx: Math.cos(moveAngle) * speed,
      vy: Math.sin(moveAngle) * speed,
      angle: rand(0, Math.PI * 2),
      rotSpeed,
    });
  }

  // starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), r: rand(0.5, 1.5) });
  }
  // initial spawns
  for (let i = 0; i < 5; i++) spawnOre();
  for (let i = 0; i < 3; i++) spawnAsteroid();

  function update() {
    if (gameOver) return;
    // ship movement
    ship.vx = (keys.ArrowRight - keys.ArrowLeft) * ship.speed;
    ship.vy = (keys.ArrowDown - keys.ArrowUp) * ship.speed;
    ship.x = (ship.x + ship.vx + width) % width;
    ship.y = (ship.y + ship.vy + height) % height;

    // update asteroids (position and rotation)
    for (const a of asteroids) {
      a.x = (a.x + a.vx + width) % width;
      a.y = (a.y + a.vy + height) % height;
      a.angle = (a.angle + a.rotSpeed) % (Math.PI * 2);
    }

    // check collisions with ore
    for (const o of ores) {
      if (!o.collected && dist(ship, o) < ship.r + o.r) {
        o.collected = true;
        score++;
        // replace ore
        spawnOre();
      }
    }

    // check collisions with asteroids
    for (const a of asteroids) {
      if (dist(ship, a) < ship.r + a.r) {
        // play explosion / crash sound
        playTone(150, 400);
        gameOver = true;
        break;
      }
    }
  }

function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship (triangle) with glow
    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.r, ship.y);
    ctx.lineTo(ship.x - ship.r * 0.5, ship.y - ship.r * 0.86);
    ctx.lineTo(ship.x - ship.r * 0.5, ship.y + ship.r * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ores (glowing with halo)
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff0';
    for (const o of ores) if (!o.collected) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // asteroids (rotating irregular shapes)
    ctx.fillStyle = '#f44';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      const sides = 7;
      for (let i = 0; i < sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        const radius = a.r * (0.8 + Math.random() * 0.4);
        ctx.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
    // asteroids
    ctx.fillStyle = '#f00';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // input handling (resume audio on first interaction)
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // start
  requestAnimationFrame(loop);
})();
