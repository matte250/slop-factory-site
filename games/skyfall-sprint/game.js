// game.js – Skyfall Sprint (concise implementation)

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);

  const player = { x: width / 2, y: height - 60, radius: 20, speed: 5 };
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  let obstacles = [];
  let coins = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  const setKey = (k, v) => { keys[k] = v; };
  window.addEventListener('keydown', e => setKey(e.key, true));
  window.addEventListener('keyup', e => setKey(e.key, false));
  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const tx = touch.clientX - rect.left;
    setKey('ArrowLeft', tx < width / 2);
    setKey('ArrowRight', tx >= width / 2);
  });
  canvas.addEventListener('touchend', () => { setKey('ArrowLeft', false); setKey('ArrowRight', false); });

  const spawnObstacle = () => {
    const w = 40 + Math.random() * 40;
    const h = 20 + Math.random() * 30;
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -h, w, h, speed: 2 + Math.random() * 2 });
  };

  const spawnCoin = () => {
    const size = 15;
    const x = Math.random() * (width - size);
    coins.push({ x, y: -size, size, speed: 2 });
  };

  const rectCircleCollide = (rc, cx, cy, cr) => {
    const nearestX = Math.max(rc.x, Math.min(cx, rc.x + rc.w));
    const nearestY = Math.max(rc.y, Math.min(cy, rc.y + rc.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < cr * cr;
  };

  const update = () => {
    if (gameOver) return;
    // Move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));

    // Spawn obstacles/coins
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 180 === 0) spawnCoin();

    // Update obstacles & check collision
    obstacles.forEach(o => (o.y += o.speed));
    obstacles = obstacles.filter(o => o.y < height);
    for (const o of obstacles) {
      if (rectCircleCollide(o, player.x, player.y, player.radius)) {
        // Play collision sound
        playTone(150, 0.3);
        gameOver = true;
        break;
      }
    }

    // Update coins & collect
    coins.forEach(c => (c.y += c.speed));
    coins = coins.filter(c => {
      const hit = rectCircleCollide({ x: c.x, y: c.y, w: c.size, h: c.size }, player.x, player.y, player.radius);
      if (hit) {
        // Play coin collection sound
        playTone(600, 0.1);
        score += 10;
      }
      return !hit && c.y < height;
    });

    frame++;
    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#f0e68c'); // light ground
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw ground line
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();
    // Player (skydiver with parachute)
    // Parachute canopy
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.arc(player.x, player.y - player.radius - 15, player.radius + 5, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Player body
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Obstacles (simple triangles)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // Coins (radial gradient circles)
    coins.forEach(c => {
      const grad = ctx.createRadialGradient(c.x + c.size / 2, c.y + c.size / 2, 2, c.x + c.size / 2, c.y + c.size / 2, c.size / 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#ff0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x + c.size / 2, c.y + c.size / 2, c.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score / Game Over
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  update();
})();
