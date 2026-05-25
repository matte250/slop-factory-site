// Simple Gravity Run game
// Canvas with id="game" must exist in the HTML.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context is resumed on first user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  canvas.addEventListener('mousedown', resumeAudio);
  canvas.addEventListener('touchstart', resumeAudio);
  const width = canvas.width;
  const height = canvas.height;

  // Ship properties
  const ship = {
    x: 50,
    y: height / 2,
    w: 30,
    h: 20,
    vy: 0,
  };
  const gravity = 0.4;
  const thrust = -8;

  // Spikes
  const spikes = [];
  const spikeWidth = 20;
  const spikeGap = 150; // distance between spikes
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  const speed = 3;

  // Stars for background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1), // twinkle speed
    });
  }

  let gameOver = false;

  // Input: click or tap applies thrust
  const applyThrust = () => { ship.vy = thrust; };
  canvas.addEventListener('mousedown', applyThrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); applyThrust(); });

  function spawnSpike() {
    const spikeHeight = 40 + Math.random() * 60; // random height
    spikes.push({ x: width, y: height - spikeHeight, w: spikeWidth, h: spikeHeight });
  }

  function update() {
    if (gameOver) return;

    // Ship physics
    ship.vy += gravity;
    ship.y += ship.vy;
    if (ship.y + ship.h > height) { // bottom collision
      ship.y = height - ship.h;
      endGame();
    }
    if (ship.y < 0) ship.y = 0; // top bound

    // Spikes movement and spawn
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnSpike();
      spawnTimer = 0;
    }
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.x -= speed;
      if (s.x + s.w < 0) spikes.splice(i, 1);
    }

    // Star twinkling
    for (const star of stars) {
      star.alpha += star.delta;
      if (star.alpha <= 0 || star.alpha >= 1) star.delta = -star.delta;
    }

    // Collision detection
    for (const s of spikes) {
      if (rectIntersect(ship, s)) {
        endGame();
        break;
      }
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw stars (simple twinkling)
    ctx.fillStyle = 'white';
    for (const star of stars) {
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw ship with gradient and shadow
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0077ff');
    ctx.fillStyle = shipGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw spikes with gradient
    for (const s of spikes) {
      const spikeGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
      spikeGrad.addColorStop(0, '#ff4d4d');
      spikeGrad.addColorStop(1, '#800000');
      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function endGame() {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  // Start the loop
  requestAnimationFrame(loop);
});
