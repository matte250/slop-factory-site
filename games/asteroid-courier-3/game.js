// game.js – simple Asteroid Courier implementation
// Targets <canvas id="game"></canvas> in the host page

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustNode = null;
  function startThrustSound(){
    if (thrustNode) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 200;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    thrustNode = {osc, gain};
  }
  function stopThrustSound(){
    if (!thrustNode) return;
    thrustNode.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustNode.osc.stop(audioCtx.currentTime + 0.1);
    thrustNode = null;
  }
  function playSound(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playExplosion(){
    playSound(100, 0.3);
  }
  function playFuel(){
    playSound(800, 0.15);
  }

  // ----- Game state -----
  // generate background stars
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 + 0.5 });
  }

  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    thrust: false,
    turn: 0, // -1 left, 1 right
    radius: 10,
    fuel: 100,
  };
  const asteroids = [];
  const fuels = [];
  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  // ----- Helper functions -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const speed = rand(0.5, 2);
    switch (side) {
      case 0: x = rand(0, width); y = -20; vx = rand(-1, 1); vy = speed; break;
      case 1: x = width + 20; y = rand(0, height); vx = -speed; vy = rand(-1, 1); break;
      case 2: x = rand(0, width); y = height + 20; vx = rand(-1, 1); vy = -speed; break;
      case 3: x = -20; y = rand(0, height); vx = speed; vy = rand(-1, 1); break;
    }
    asteroids.push({ x, y, vx, vy, r: rand(15, 30) });
  }

  function spawnFuel() {
    fuels.push({
      x: rand(30, width - 30),
      y: rand(30, height - 30),
      r: 8,
    });
  }

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updateControls() {
    ship.turn = 0;
    if (keys.ArrowLeft || keys.a) ship.turn = -1;
    if (keys.ArrowRight || keys.d) ship.turn = 1;
    ship.thrust = keys.ArrowUp || keys.w;
  }

  // ----- Main loop -----
  function update(dt) {
    if (gameOver) return;
    // controls
    updateControls();
    ship.angle += ship.turn * dt * 0.003;
    if (ship.thrust && ship.fuel > 0) {
      const accel = 0.05;
      ship.vx += Math.cos(ship.angle) * accel;
      ship.vy += Math.sin(ship.angle) * accel;
      ship.fuel = Math.max(0, ship.fuel - dt * 0.01);
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // screen wrap
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // dampening
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < -40) a.x = width + 40;
      if (a.x > width + 40) a.x = -40;
      if (a.y < -40) a.y = height + 40;
      if (a.y > height + 40) a.y = -40;
    });
    // fuel cans disappear slowly
    if (Math.random() < 0.001) spawnFuel();
    // spawn asteroids gradually
    if (Math.random() < 0.02) spawnAsteroid();
    // collisions ship-asteroid
    for (const a of asteroids) {
      if (distance(ship, a) < ship.radius + a.r) {
        playExplosion();
        gameOver = true;
        break;
      }
    }
    // collisions ship-fuel
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
        if (distance(ship, f) < ship.radius + f.r) {
          ship.fuel = Math.min(100, ship.fuel + 30);
          playFuel();
          fuels.splice(i, 1);
        }
    }
    // fuel depletion end
    if (ship.fuel <= 0) gameOver = true;
    // score
    score += dt * 0.001;
  }

  function draw() {
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#003');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    // thrust flame
    if (ship.thrust) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      const flame = ctx.createRadialGradient(-14, 0, 1, -14, 0, 6);
      flame.addColorStop(0, '#ff0');
      flame.addColorStop(1, '#f00');
      ctx.fillStyle = flame;
      ctx.fill();
    }
    ctx.restore();
    // asteroids with shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x - a.r/3, a.y - a.r/3, a.r/5, a.x, a.y, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cans with glow
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(0.7, '#fa0');
      grad.addColorStop(1, '#c00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '28px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(score)}`,
        width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
