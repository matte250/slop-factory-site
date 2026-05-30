// Simple Space Junk Dodger game
// Assumes an existing <canvas id="game"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Player -----
  // Initialize stars for background
const stars = [];
for (let i = 0; i < 50; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    speed: 0.5 + Math.random() * 1.5,
  });
}

const player = {
    x: 50,
    y: height / 2,
    w: 30,
    h: 20,
    speed: 4,
    color: '#0ff',
  };

  // ----- Input -----
  const keys = {};
  let audioStarted = false;
window.addEventListener('keydown', e => {
  if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
  keys[e.key] = true;
});
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Obstacles (space junk) -----
  const obstacles = [];
  const obstacleSpawnInterval = 90; // frames
  let spawnCounter = 0;

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const yPos = Math.random() * (height - size);
    const speed = 2 + Math.random() * 3;
    obstacles.push({ x: width, y: yPos, w: size, h: size, speed, color: '#f90' });
  }

  // ----- Score -----
  let frames = 0;
  let score = 0;

  // ----- Game Loop -----
  function update() {
    // Move player
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(width - player.w, player.x));
    player.y = Math.max(0, Math.min(height - player.h, player.y));

    // Spawn obstacles
    if (spawnCounter <= 0) {
      spawnObstacle();
      spawnCounter = obstacleSpawnInterval;
    } else {
      spawnCounter--;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= obs.speed;
      if (obs.x + obs.w < 0) {
        obstacles.splice(i, 1);
        score++; // passed junk
        playTone(400, 0.05); // score sound
      }
    }

    // Collision detection
    for (const obs of obstacles) {
      if (
        player.x < obs.x + obs.w &&
        player.x + player.w > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.h > obs.y
      ) {
        // Game over - play crash sound
        playTone(120, 0.5);
        cancelAnimationFrame(rafId);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2 - 20);
        ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
        return;
      }
    }

    // Draw everything
    ctx.clearRect(0, 0, width, height);

// Background stars (moving)
  // Fill background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#004');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  // Update and draw stars
  stars.forEach(star => {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = width;
      star.y = Math.random() * height;
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(star.x, star.y, 2, 2);
  });

// Player ship (triangle)
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.h / 2);
  ctx.lineTo(player.x + player.w, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();

// Obstacles (circles with gradient)
  obstacles.forEach(obs => {
    const grad = ctx.createRadialGradient(
      obs.x + obs.w / 2,
      obs.y + obs.h / 2,
      obs.w / 4,
      obs.x + obs.w / 2,
      obs.y + obs.h / 2,
      obs.w / 2
    );
    grad.addColorStop(0, '#ffd27f');
    grad.addColorStop(1, '#ff5500');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);

    frames++;
    rafId = requestAnimationFrame(update);
  }

  let rafId = requestAnimationFrame(update);
})();
