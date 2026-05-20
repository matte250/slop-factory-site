// Minimalist canvas game based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player state
  const player = { x: width / 2, y: height / 2, r: 0, vx: 0, vy: 0, size: 10 };
  const keys = { left: false, right: false, up: false };

  // Enemy list
  const enemies = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let speedIncrease = 0.001; // per ms
  let baseEnemySpeed = 0.5;
  let lastTime = performance.now();
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 200;
    gain.gain.value = 0.05;
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    else if (e.code === 'ArrowRight') keys.right = true;
    else if (e.code === 'ArrowUp') {
      keys.up = true;
      startThrustSound();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    else if (e.code === 'ArrowRight') keys.right = false;
    else if (e.code === 'ArrowUp') {
      keys.up = false;
      stopThrustSound();
    }
  });

  function spawnEnemy() {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = 0; y = Math.random() * height; } // left
    else if (edge === 1) { x = width; y = Math.random() * height; } // right
    else if (edge === 2) { x = Math.random() * width; y = 0; } // top
    else { x = Math.random() * width; y = height; } // bottom
    const angle = Math.atan2(player.y - y, player.x - x);
    enemies.push({ x, y, angle, size: 8, speed: baseEnemySpeed });
  }

  function update(dt) {
    // player rotation
    if (keys.left) player.r -= 0.003 * dt;
    if (keys.right) player.r += 0.003 * dt;
    // thrust
    if (keys.up) {
      const thrust = 0.001 * dt;
      player.vx += Math.cos(player.r) * thrust;
      player.vy += Math.sin(player.r) * thrust;
    }
    // apply velocity
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    // simple damping
    player.vx *= 0.99;
    player.vy *= 0.99;

    // boundary check (lose condition)
    if (player.x < 0 || player.x > width || player.y < 0 || player.y > height) {
      gameOver = true;
      playExplosion();
    }

    // spawn enemies over time
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnEnemy();
      lastSpawn = performance.now();
    }

    // increase difficulty
    spawnInterval = Math.max(200, spawnInterval - speedIncrease * dt);
    baseEnemySpeed += speedIncrease * dt * 0.05;

    // update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      // move toward player (angle may lag slightly as player moves)
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const ang = Math.atan2(dy, dx);
      e.x += Math.cos(ang) * e.speed * dt;
      e.y += Math.sin(ang) * e.speed * dt;
      // collision with player
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
if (dist < (e.size + player.size) / 2) {
      gameOver = true;
      playExplosion();
    }
    }
  }

  // draw background gradient once
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#001133');
  bgGradient.addColorStop(1, '#000');

  function draw() {
    // Fade trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    // Optional: overlay gradient for depth
    ctx.fillStyle = bgGradient;
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    // player (draw as triangle with stroke)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.r);
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.size / 2, 0);
    ctx.lineTo(-player.size / 2, -player.size / 2);
    ctx.lineTo(-player.size / 2, player.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // enemies with radial gradient
    enemies.forEach(e => {
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size / 2);
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(1, '#800000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  requestAnimationFrame(loop);
})();
