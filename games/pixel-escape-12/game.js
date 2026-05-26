// Simple Pixel Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 400;

  // Player (single pixel)
  const player = { x: width / 2, y: height / 2, size: 5, speed: 2 };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const obstacles = [];
  const tokens = [];
  let score = 0;
  let gameOver = false;
  let lastObstacleSpawn = 0;
  let lastTokenSpawn = 0;

  const spawnObstacle = () => {
    // generate a random pastel color for the obstacle
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 60%)`;
    const side = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const size = 10 + Math.random() * 15;
    const speed = 1 + Math.random() * 1.5;
    switch (side) {
      case 0: // top
        x = Math.random() * width; y = -size; vx = (player.x - x) / width * speed; vy = speed; break;
      case 1: // right
        x = width + size; y = Math.random() * height; vx = -speed; vy = (player.y - y) / height * speed; break;
      case 2: // bottom
        x = Math.random() * width; y = height + size; vx = (player.x - x) / width * speed; vy = -speed; break;
      case 3: // left
        x = -size; y = Math.random() * height; vx = speed; vy = (player.y - y) / height * speed; break;
    }
      obstacles.push({ x, y, size, vx, vy, color });
      // sound for new obstacle
      playTone(200, 0.05);
  };

  const spawnToken = () => {
    const size = 5;
    const x = Math.random() * (width - size);
    const y = Math.random() * (height - size);
    tokens.push({ x, y, size, collected: false });
  };

  const rectIntersect = (a, b) => a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;

  const update = (dt) => {
    if (gameOver) return;
    // move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // clamp
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // update obstacles
    obstacles.forEach(o => { o.x += o.vx; o.y += o.vy; });
    // remove offscreen obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.x < -o.size || o.x > width + o.size || o.y < -o.size || o.y > height + o.size) obstacles.splice(i, 1);
      else if (rectIntersect(player, o)) { gameOver = true; playTone(150, 0.3); }
    }

    // check tokens
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      if (rectIntersect(player, t)) { score++; tokens.splice(i, 1); }
    }

    // spawn logic
    const now = performance.now();
    if (now - lastObstacleSpawn > 1500) { spawnObstacle(); lastObstacleSpawn = now; }
    if (now - lastTokenSpawn > 3000) { spawnToken(); lastTokenSpawn = now; }
  };

  const draw = () => {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001d3a');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // player (glowing circle)
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size, 0, Math.PI * 2);
    ctx.fill();
    // obstacles (colored squares)
    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.size, o.size);
    });
    // tokens (glowing yellow)
    tokens.forEach(t => {
      const grad = ctx.createRadialGradient(t.x + t.size/2, t.y + t.size/2, 1, t.x + t.size/2, t.y + t.size/2, t.size);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(t.x, t.y, t.size, t.size);
    });
    // score
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  };

  let lastTime = 0;
  const loop = (time) => {
    const dt = time - lastTime;
    lastTime = time;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
