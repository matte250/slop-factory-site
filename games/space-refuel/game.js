// Simple Space Refuel game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function startAudio(){
    if (!audioStarted && audioCtx.state !== 'running'){
      audioCtx.resume();
    }
    audioStarted = true;
  }
  function playBeep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game settings
  const TARGET_FUEL = 30;
  const MAX_TIME = 60; // seconds
  const SHIP_WIDTH = 40;
  const SHIP_HEIGHT = 20;
  const SHIP_SPEED = 4;
  const ITEM_RADIUS = 8;
  const ITEM_FALL_SPEED = 2;
  const METEOR_SPEED = 3;

  // Starfield background (simple twinkling stars)
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // State
  let shipX = WIDTH / 2 - SHIP_WIDTH / 2;
  const shipY = HEIGHT - SHIP_HEIGHT - 10;
  let leftPressed = false;
  let rightPressed = false;
  let fuelCollected = 0;
  let startTime = null;
  let gameOver = false;
  let win = false;

  const fuels = [];
  const meteors = [];

  // Helper to spawn items
  function spawnFuel() {
    const x = Math.random() * (WIDTH - ITEM_RADIUS * 2) + ITEM_RADIUS;
    fuels.push({ x, y: -ITEM_RADIUS, radius: ITEM_RADIUS });
  }
  function spawnMeteor() {
    const x = Math.random() * (WIDTH - ITEM_RADIUS * 2) + ITEM_RADIUS;
    meteors.push({ x, y: -ITEM_RADIUS, radius: ITEM_RADIUS });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    startAudio();
    if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'ArrowRight') rightPressed = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
  });

  function update(delta) {
    // Move ship
    if (leftPressed) shipX = Math.max(0, shipX - SHIP_SPEED);
    if (rightPressed) shipX = Math.min(WIDTH - SHIP_WIDTH, shipX + SHIP_SPEED);

    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += ITEM_FALL_SPEED;
      // Collision with ship
      if (
        f.y + f.radius >= shipY &&
        f.x > shipX &&
        f.x < shipX + SHIP_WIDTH
      ) {
        fuelCollected++;
        playBeep(600, 0.1);
        fuels.splice(i, 1);
        continue;
      }
      // Remove off‑screen
      if (f.y - f.radius > HEIGHT) fuels.splice(i, 1);
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += METEOR_SPEED;
      // Collision with ship -> lose
      if (
        m.y + m.radius >= shipY &&
        m.x > shipX &&
        m.x < shipX + SHIP_WIDTH
      ) {
        playBeep(200, 0.4);
        gameOver = true;
      }
      // Remove off‑screen
      if (m.y - m.radius > HEIGHT) meteors.splice(i, 1);
    }

    // Spawn logic
    if (Math.random() < 0.02) spawnFuel(); // ~1 per 50 frames
    if (Math.random() < 0.015) spawnMeteor();

    // Win/lose checks
    if (fuelCollected >= TARGET_FUEL) { win = true; gameOver = true; }
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= MAX_TIME) { gameOver = true; }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Stars – twinkle
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha * (0.8 + Math.random() * 0.4);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Ship – simple triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(shipX, shipY + SHIP_HEIGHT);
    ctx.lineTo(shipX + SHIP_WIDTH / 2, shipY);
    ctx.lineTo(shipX + SHIP_WIDTH, shipY + SHIP_HEIGHT);
    ctx.closePath();
    ctx.fill();
    // Fuel canisters – gradient rectangles
    fuels.forEach(f => {
      const grad = ctx.createLinearGradient(f.x - ITEM_RADIUS, f.y - ITEM_RADIUS, f.x + ITEM_RADIUS, f.y + ITEM_RADIUS);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#080');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x - ITEM_RADIUS, f.y - ITEM_RADIUS, ITEM_RADIUS * 2, ITEM_RADIUS * 2);
    });
    // Meteoroids – irregular polygons
    ctx.fillStyle = '#f44';
    meteors.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.x, m.y - m.radius);
      ctx.lineTo(m.x - m.radius, m.y + m.radius);
      ctx.lineTo(m.x + m.radius, m.y + m.radius);
      ctx.closePath();
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${fuelCollected}/${TARGET_FUEL}`, 10, 20);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = win ? 'green' : 'red';
      ctx.font = '30px sans-serif';
      const msg = win ? 'You Win!' : 'Game Over';
      const txt = ctx.measureText(msg);
      ctx.fillText(msg, (WIDTH - txt.width) / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    if (!gameOver) {
      update(timestamp);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
