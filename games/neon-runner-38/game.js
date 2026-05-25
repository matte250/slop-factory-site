// Neon Runner – simple endless runner
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 40,
    speed: 6,
    color: '#0ff',
    move: 0 // -1 left, 1 right, 0 none
  };

  // Obstacles
  const obstacles = [];
  const obstacleTypes = [
    {w: 80, h: 20, color: '#f0f', speed: 3}, // bar
    {w: 20, h: 80, color: '#f80', speed: 4} // spike
  ];

  let distance = 0;

  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playCollision = () => playTone(150, 200);
  const playMove = () => playTone(400, 80);

  let gameOver = false;
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms

  // Input handling
  const setMove = (dir) => ship.move = dir;
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') { setMove(-1); playMove(); }
    if (e.key === 'ArrowRight') { setMove(1); playMove(); }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' && ship.move === -1) setMove(0);
    if (e.key === 'ArrowRight' && ship.move === 1) setMove(0);
  });

  const rectCollides = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;

  const spawnObstacle = () => {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const x = Math.random() * (width - type.w);
    obstacles.push({x, y: -type.h, w: type.w, h: type.h, color: type.color, speed: type.speed});
  };

  const update = (dt) => {
    if (gameOver) return;

    // Move player
    ship.x += ship.move * ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i, 1);
      else if (rectCollides(ship, o)) { playCollision(); gameOver = true; }
    }

    // Spawn new obstacles periodically
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    distance += dt * 0.01; // arbitrary distance metric
  };

  // Draw function with neon graphics
  const draw = () => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars field (generated once)
    if (!window.__stars) {
      const starCount = 100;
      window.__stars = [];
      for (let i = 0; i < starCount; i++) {
        window.__stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.5 + 0.5
        });
      }
    }
    ctx.fillStyle = '#fff';
    window.__stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Neon glow settings
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'cyan';

    // Ship – draw as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Obstacles – draw with glow
    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Reset glow for HUD
    ctx.shadowBlur = 0;
    // HUD
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    ctx.fillText(`Distance: ${Math.floor(distance)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px monospace';
      ctx.fillText(`Traveled: ${Math.floor(distance)}`, width / 2, height / 2 + 40);
    }
  };

  let lastTime = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
