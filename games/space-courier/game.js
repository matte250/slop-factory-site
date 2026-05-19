// Simple Space Courier game with enhanced graphics
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone player
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrustTime = 0;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship state
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 20,
    speed: 2,
    fuel: 100,
    color: '#0ff',
    thrusting: false,
  };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const obstacles = [];
  const obstacleRate = 0.02; // chance per frame

  function spawnObstacle() {
    // Randomly choose asteroid or turret
    const type = Math.random() < 0.7 ? 'asteroid' : 'turret';
    const size = type === 'asteroid' ? 30 : 20;
    obstacles.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 1 + Math.random() * 2,
      type,
    });
  }

  function update() {
    // Ship movement & fuel consumption
    let moved = false;
    if (keys.ArrowLeft || keys.a) { ship.x -= ship.speed; moved = true; }
    if (keys.ArrowRight || keys.d) { ship.x += ship.speed; moved = true; }
    if (keys.ArrowUp || keys.w) { ship.y -= ship.speed; moved = true; }
    if (keys.ArrowDown || keys.s) { ship.y += ship.speed; moved = true; }
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    // Thrust flag for visual effect
    ship.thrusting = moved && ship.fuel > 0;
    if (moved && ship.fuel > 0) ship.fuel -= 0.05; // fuel drain per thrust
    // Play thrust sound (throttle to avoid spamming)
    if (ship.thrusting) {
      const now = performance.now();
      if (now - lastThrustTime > 100) { // 100ms interval
        playTone(300, 0.05);
        lastThrustTime = now;
      }
    }

    // Spawn obstacles
    if (Math.random() < obstacleRate) spawnObstacle();

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        endGame('Collision');
        return;
      }
    }

    if (ship.fuel <= 0) {
      endGame('Out of fuel');
      return;
    }
  }

  // Pre‑generated starfield with twinkling
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.5 + 0.5,
    });
  }

  function drawStarfield() {
    // deep space background with slight gradient
    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0, '#001');
    grd.addColorStop(1, '#000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
    // draw stars with subtle twinkle
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      // twinkle by modulating alpha
      const alpha = star.brightness + Math.sin(Date.now() / 500 + star.x) * 0.2;
      ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawShip() {
    // ship body
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (ship.thrusting) {
      const flameHeight = 12;
      const gradient = ctx.createLinearGradient(0, ship.y + ship.h, 0, ship.y + ship.h + flameHeight);
      gradient.addColorStop(0, 'rgba(255,200,0,0.8)');
      gradient.addColorStop(1, 'rgba(255,50,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.w * 0.2, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w * 0.8, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h + flameHeight);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      if (o.type === 'asteroid') {
        // draw asteroid as a gray circle with shading
        const grad = ctx.createRadialGradient(
          o.x + o.w / 2,
          o.y + o.h / 2,
          o.w * 0.2,
          o.x + o.w / 2,
          o.y + o.h / 2,
          o.w / 2
        );
        grad.addColorStop(0, '#aaa');
        grad.addColorStop(1, '#555');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // turret: red rectangle with a simple gun barrel
        ctx.fillStyle = '#b00';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        // gun barrel
        ctx.fillStyle = '#600';
        ctx.fillRect(o.x + o.w * 0.4, o.y + o.h, o.w * 0.2, o.h * 0.5);
      }
    }
  }

  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 20);
  }

  let gameOver = false;
  function endGame(reason) {
    gameOver = true;
    // Play death sound based on reason
    if (reason === 'Collision') {
      playTone(100, 0.5);
    } else if (reason === 'Out of fuel') {
      playTone(50, 0.5);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f00';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillText(reason, width / 2, height / 2 + 20);
  }

  function loop() {
    if (gameOver) return;
    update();
    drawStarfield();
    drawObstacles();
    drawShip();
    drawHUD();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
