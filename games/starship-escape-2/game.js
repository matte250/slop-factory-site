// Starship Escape with enhanced graphics
// Canvas must have id="game"
(() => {
  const canvas = document.getElementById('game');
  // Starfield background
  const stars = Array.from({length: 100}, () => ({ x: Math.random() * 800, y: Math.random() * 600, size: Math.random() * 2 + 1 }));
  // Ship particles
  const particles = [];
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Ship
  const ship = { x: W / 2, y: H - 60, w: 20, h: 30, speed: 4, fuel: 100 };
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Obstacles & fuel
  const asteroids = [];
  const fuels = [];
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (W - size), y: -size, r: size / 2, speed: 2 + Math.random() * 2 });
  }
  function spawnFuel() {
    const size = 15;
    fuels.push({ x: Math.random() * (W - size), y: -size, r: size / 2, speed: 1.5, value: 10 });
  }
  setInterval(spawnAsteroid, 1200);
  setInterval(spawnFuel, 3500);

  function rectCircleCollision(rect, circle) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update() {
    // Play sound when ship moves
    if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) {
      playTone(220, 'sawtooth', 0.05);
    }
    // Add trail particles when ship moves
    if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) {
      particles.push({
        x: ship.x + ship.w / 2,
        y: ship.y + ship.h / 2,
        radius: 2 + Math.random() * 2,
        alpha: 1
      });
    }
    // Update particles fade
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.alpha -= 0.02;
      p.y -= 0.5;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
    if (keys.ArrowRight && ship.x + ship.w < W) ship.x += ship.speed;
    if (keys.ArrowUp && ship.y > 0) ship.y -= ship.speed;
    if (keys.ArrowDown && ship.y + ship.h < H) ship.y += ship.speed;
    // Fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) gameOver = true;
    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > H) asteroids.splice(i, 1);
      else if (rectCircleCollision(ship, a)) {
      playTone(440, 'square', 0.2);
      gameOver = true;
    }
    }
    // Move fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.r > H) fuels.splice(i, 1);
      else if (rectCircleCollision(ship, f)) {
        playTone(660, 'triangle', 0.1);
        ship.fuel = Math.min(100, ship.fuel + f.value);
        score += f.value;
        fuels.splice(i, 1);
      }
    }
    score = Math.round(score + 0.1);
    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);
    // Starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle with gradient)
    const grad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.h);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Ship trail particles
    particles.forEach(p => {
      ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Asteroids with shading
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      radGrad.addColorStop(0, '#eee');
      radGrad.addColorStop(1, '#555');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel cells with glow
    fuels.forEach(f => {
      const glow = ctx.createRadialGradient(f.x, f.y, f.r * 0.3, f.x, f.y, f.r);
      glow.addColorStop(0, '#0f0');
      glow.addColorStop(1, '#030');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  update();
})();
