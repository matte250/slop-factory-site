// Minimal Meteor Dash game
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Simple sound manager using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect() { playTone(800, 0.08, 'triangle'); }
  function playExplosion() { playTone(150, 0.3, 'sawtooth'); }
  function playFuelLow() { playTone(300, 0.2, 'sine'); }

  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: width / 2, y: height - 40, w: 30, h: 30, speed: 4 };
  let meteors = [];
  let fuels = [];
  let score = 0;
  let fuel = 100; // starts full, depletes over time
  let lastMeteor = 0;
  let lastFuel = 0;
  let running = true;

  // Input handling
  const keys = {};
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    const size = 20 + Math.random() * 30;
    meteors.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 3 });
  }
  function spawnFuel() {
    const size = 15;
    fuels.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 });
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // spawn meteors every ~800ms
    if (performance.now() - lastMeteor > 800) {
      spawnMeteor();
      lastMeteor = performance.now();
    }
    // spawn fuel cells every ~3000ms
    if (performance.now() - lastFuel > 3000) {
      spawnFuel();
      lastFuel = performance.now();
    }

    // move meteors
    meteors.forEach(m => m.y += m.speed);
    meteors = meteors.filter(m => m.y < height);
    // move fuels
    fuels.forEach(f => f.y += f.speed);
    fuels = fuels.filter(f => f.y < height);

    // collision detection
    for (const m of meteors) {
      if (rectsOverlap(ship, m)) {
        running = false;
        playExplosion();
      }
    }
    fuels = fuels.filter(f => {
      if (rectsOverlap(ship, f)) {
        fuel = Math.min(100, fuel + 30);
        playCollect();
        return false;
      }
      return true;
    });

    // fuel consumption & score
    fuel -= dt * 0.02; // deplete over time
    if (fuel <= 0) running = false;
    score += dt * 0.01;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // star field background with moving stars
    // initialize stars once
    if (!window.__stars) {
      window.__stars = [];
      for (let i = 0; i < 80; i++) {
        window.__stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1 + Math.random() * 2,
          speed: 0.5 + Math.random() * 0.5,
        });
      }
    }
    // update and draw stars
    window.__stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
      ctx.fillStyle = '#555';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    })
    // ship (triangle with gradient)
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#004400');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // meteors (glowing circles)
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cells (glowing squares)
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(
        f.x + f.w / 2,
        f.y + f.h / 2,
        f.w * 0.1,
        f.x + f.w / 2,
        f.y + f.h / 2,
        f.w / 2
      );
      grad.addColorStop(0, '#77aaff');
      grad.addColorStop(1, '#0044aa');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x, f.y, f.w, f.h);
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width/2, height/2 - 20);
      ctx.fillText(`Final Score: ${Math.floor(score)}`, width/2, height/2 + 20);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
