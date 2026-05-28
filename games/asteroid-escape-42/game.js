// Simple Asteroid Escape game
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  // Fit canvas to window
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  addEventListener('resize', resize);
  resize();

  // Ship definition (triangle) – treat as circle for collision
  const ship = { x: 80, y: canvas.height / 2, radius: 12, speed: 5, dx: 0, dy: 0 };
  const shipTrail = []; // stores recent positions for glow trail
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
  addEventListener('keydown', e => { if (audioCtx.state === 'suspended') audioCtx.resume(); if (e.key in keys) keys[e.key] = true; });
  addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroid pool
  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms
  let startTime = performance.now();
  let gameOver = false;

  const updateShip = () => {
    ship.dx = (keys.ArrowLeft || keys.a) ? -ship.speed : (keys.ArrowRight || keys.d) ? ship.speed : 0;
    ship.dy = (keys.ArrowUp || keys.w) ? -ship.speed : (keys.ArrowDown || keys.s) ? ship.speed : 0;
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y + ship.dy));
    // record trail
    shipTrail.push({ x: ship.x, y: ship.y });
    if (shipTrail.length > 20) shipTrail.shift();
  };

  const spawnAsteroid = (now) => {
    const radius = 10 + Math.random() * 15;
    const speed = 2 + (now - startTime) / 20000; // increase over time
    asteroids.push({ x: canvas.width + radius, y: Math.random() * canvas.height, radius, speed });
    // subtle spawn sound
    playTone(400, 0.05);
  };

  const updateAsteroids = () => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
  };

  const checkCollision = () => {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) return true;
    }
    return false;
  };

  // Starfield background with gradient and twinkling stars
  const drawStarfield = () => {
    // Gradient background (dark blue to black)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Twinkling stars of varying size and opacity
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2;
      ctx.globalAlpha = 0.3 + Math.random() * 0.7;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  };

  // Draw ship with green fill and slight glow
  // Draw ship with green fill, slight glow, and trailing effect
  const drawShipTrail = () => {
    ctx.save();
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = ship.radius * 2;
    for (let i = 0; i < shipTrail.length - 1; i++) {
      const p1 = shipTrail[i];
      const p2 = shipTrail[i + 1];
      const alpha = (i + 1) / shipTrail.length * 0.5; // fade older points
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawShip = () => {
    // Draw ship with green fill and slight glow
    ctx.save();
    ctx.fillStyle = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.radius, ship.y);
    ctx.lineTo(ship.x - ship.radius, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Draw asteroids with radial gradient shading
  const drawAsteroids = () => {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.1, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawScore = (now) => {
    const seconds = ((now - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${seconds}s`, 20, 30);
  };

  const loop = (now) => {
    if (gameOver) return;
    // spawn
    if (now - lastSpawn > spawnInterval) { spawnAsteroid(now); lastSpawn = now; }
    updateShip();
    updateAsteroids();
    if (checkCollision()) { playTone(200, 0.3); gameOver = true; }
    // render
    drawStarfield();
    drawShipTrail();
    drawShip();
    drawAsteroids();
    drawScore(now);
    if (!gameOver) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
      drawScore(now);
    }
  };

  requestAnimationFrame(loop);
})();
