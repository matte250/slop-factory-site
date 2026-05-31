// Game based on IDEA.md – Cosmic Courier
// Targets canvas with id "game"
(() => {
  const canvas = document.getElementById("game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // background stars
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
  }));

  // Player ship
  const ship = {
    x: W / 2,
    y: H - 60,
    r: 12,
    speed: 3,
    fuel: 100,
    dx: 0,
    dy: 0,
  };

  const keys = {};
  addEventListener("keydown", (e) => {
    // resume audio context on first interaction
    if (audioCtx.state !== "running") audioCtx.resume();
    keys[e.key] = true;
  });
  addEventListener("keyup", (e) => (keys[e.key] = false));

  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }

  const asteroids = [];
  const packages = [];
  let score = 0;
  let gameOver = false;
  let frames = 0;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (W - size),
      y: -size,
      r: size / 2,
      vy: 1 + Math.random() * 2,
    });
  }

  function spawnPackage() {
    const size = 15;
    packages.push({
      x: Math.random() * (W - size),
      y: -size,
      r: size / 2,
      vy: 2,
    });
  }

  function update() {
    if (gameOver) return;

    // Controls
    ship.dx = ship.dy = 0;
    if (keys["ArrowLeft"]) ship.dx = -ship.speed;
    if (keys["ArrowRight"]) ship.dx = ship.speed;
    if (keys["ArrowUp"]) ship.dy = -ship.speed;
    if (keys["ArrowDown"]) ship.dy = ship.speed;

    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x + ship.dx));
    ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y + ship.dy));

    // Fuel consumption
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) {
      gameOver = true;
      // Out of fuel sound
      playTone(100, 0.5);
    }

    // Spawn logic
    if (frames % 120 === 0) spawnAsteroid(); // every 2s @60fps
    if (frames % 180 === 0) spawnPackage(); // every 3s

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      // collision with ship
      const dx = a.x - ship.x,
        dy = a.y - ship.y;
if (Math.hypot(dx, dy) < a.r + ship.r) {
          gameOver = true;
          // Crash sound
          playTone(150, 0.4);
        }
      // remove offscreen
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Move packages
    for (let i = packages.length - 1; i >= 0; i--) {
      const p = packages[i];
      p.y += p.vy;
      const dx = p.x - ship.x,
        dy = p.y - ship.y;
if (Math.hypot(dx, dy) < p.r + ship.r) {
          score++;
          // Pickup sound
          playTone(440, 0.2);
          packages.splice(i, 1);
          ship.fuel = Math.min(100, ship.fuel + 10);
          continue;
        }
      if (p.y - p.r > H) packages.splice(i, 1);
    }

    frames++;
  }

  function draw() {
    // space background
    ctx.fillStyle = "#000011";
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = "#fff";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ctx.fillStyle = "#0ff";
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r, ship.r);
    ctx.lineTo(-ship.r, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids (jagged)
    ctx.fillStyle = "#555";
    asteroids.forEach((a) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i * Math.PI * 2) / points;
        const radius = a.r * (0.7 + Math.random() * 0.6);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // Packages (box)
    ctx.fillStyle = "#ff0";
    packages.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const size = p.r * 1.5;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    });
    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f00";
      ctx.font = "30px sans-serif";
      ctx.fillText("Game Over", W / 2 - 80, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
