// Neon Reflex – simple arcade reflex game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  // Background music (looped). Use a royalty‑free online source.
  const bgAudio = new Audio('https://cdn.jsdelivr.net/gh/akshaykhale/FreeAudioAssets@master/looping_neon_beat.mp3');
  bgAudio.loop = true;
  bgAudio.volume = 0.2;
  bgAudio.play().catch(() => {}); // ignore autoplay errors

  // Collision sound using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }

  // Player dot (neon style)
  const player = {
    radius: 8,
    x: width / 2,
    y: height - 20,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Falling bars
  const bars = [];
  const barSpawnInterval = 800; // ms
  let lastBarTime = 0;

  // Score
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    // Resume audio context on user interaction (required by some browsers)
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  function spawnBar() {
    const barWidth = 30 + Math.random() * 70; // 30‑100px
    const speed = 2 + Math.random() * 3; // 2‑5px per frame
    bars.push({
      x: Math.random() * (width - barWidth),
      y: -20,
      w: barWidth,
      h: 15,
      speed,
    });
  }

  function update(dt) {
    // Player movement
    if (player.moveLeft) player.x -= player.speed;
    if (player.moveRight) player.x += player.speed;
    // Keep inside canvas
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));

    // Spawn bars
    if (performance.now() - lastBarTime > barSpawnInterval) {
      spawnBar();
      lastBarTime = performance.now();
    }

    // Update bars
    for (let i = bars.length - 1; i >= 0; i--) {
      const b = bars[i];
      b.y += b.speed;
      // Remove off‑screen bars
      if (b.y > height) bars.splice(i, 1);
    }

    // Update starfield (move downwards, wrap)
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Collision detection (circle‑rectangle)
    for (const b of bars) {
      const nearestX = Math.max(b.x, Math.min(player.x, b.x + b.w));
      const nearestY = Math.max(b.y, Math.min(player.y, b.y + b.h));
      const dx = player.x - nearestX;
      const dy = player.y - nearestY;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        gameOver = true;
        playCollisionSound();
        break;
      }
    }

    // Score as seconds survived
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Background gradient (neon dark)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Reset shadow for other drawing
    ctx.shadowBlur = 0;

    // Slight motion blur trail
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, width, height);

    // Draw player with neon glow and pulse effect
    const pulse = Math.sin(performance.now() / 200) * 2; // subtle size pulse
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    // Reset shadow for other drawing
    ctx.shadowBlur = 0;

    // Draw bars with neon glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f0f';
    for (const b of bars) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.shadowBlur = 0;

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // Starfield for neon background
const stars = [];
const starCount = 100;
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 1 + Math.random() * 2,
    speed: 0.2 + Math.random() * 0.5,
  });
}
let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
