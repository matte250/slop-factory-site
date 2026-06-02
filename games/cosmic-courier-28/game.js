// Simple Cosmic Courier game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function initAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!backgroundOsc) startBackground();
  }
  let backgroundOsc;
  function startBackground() {
    backgroundOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    backgroundOsc.frequency.value = 60;
    backgroundOsc.type = 'sine';
    backgroundOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    backgroundOsc.start();
  }
  function stopBackground() {
    if (backgroundOsc) {
      backgroundOsc.stop();
      backgroundOsc.disconnect();
      backgroundOsc = null;
    }
  }
  function playBeep(freq, duration) {
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
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  let ship = { x: 100, y: height / 2, w: 30, h: 15, vy: 0 };
  let fuel = 100; // percent
  const asteroids = [];
  let stars = [];
  let frame = 0;

  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 });
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width, y: Math.random() * (height - size), w: size, h: size, vx: 2 + Math.random() * 3 });
  }

  function update() {
    // background stars
    for (let s of stars) {
      s.x -= 0.5;
      if (s.x < 0) s.x = width;
    }
    // ship physics
    ship.vy += 0.1; // gravity
    ship.y += ship.vy;
    if (ship.y + ship.h > height) { ship.y = height - ship.h; ship.vy = 0; }
    if (ship.y < 0) { ship.y = 0; ship.vy = 0; }
    // fuel consumption
    if (fuel > 0) fuel -= 0.02;
    // asteroids
    if (frame % 90 === 0) spawnAsteroid();
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.vx;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }
    // collision detection
    for (let a of asteroids) {
      if (ship.x < a.x + a.w && ship.x + ship.w > a.x && ship.y < a.y + a.h && ship.y + ship.h > a.y) {
        gameOver();
        return;
      }
    }
    if (fuel <= 0) { gameOver(); return; }
    frame++;
  }

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#003');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // stars with slight flicker
  for (let s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ship (triangle) with thrust flame
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h / 2);
  ctx.lineTo(ship.x + ship.w, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  if (ship.vy < -1) { // show flame when thrusting
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 - 5);
    ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 + 5);
    ctx.closePath();
    ctx.fill();
  }

  // asteroids as shaded circles
  for (let a of asteroids) {
    const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.2, a.x + a.w/2, a.y + a.h/2, a.w/2);
    grad.addColorStop(0, '#a52a2a');
    grad.addColorStop(1, '#5c2a1c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI * 2);
    ctx.fill();
  }

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
}

  function loop() {
    initAudio(); // ensure audio context active
    update();
    draw();
    if (!running) return;
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    // play collision sound
    initAudio();
    playBeep(200, 0.3);
    stopBackground();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', width / 2 - 80, height / 2);
  }

  // input handling – thrust on space or click
  function thrust() {
    initAudio();
    ship.vy = -3;
    fuel = Math.max(fuel - 0.5, 0);
    playBeep(800, 0.05); // thrust sound
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') thrust(); });
  canvas.addEventListener('mousedown', thrust);

  let running = true;
  loop();
})();
