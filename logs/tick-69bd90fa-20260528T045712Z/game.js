// Neon Dodge game with enhanced graphics
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 200;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }
  // resume audio on first interaction
  function resumeAudio(){if(audioCtx.state==='suspended')audioCtx.resume();}
  window.addEventListener('click',resumeAudio);
  window.addEventListener('keydown',resumeAudio);
  // starfield for background effect
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: 0.5 + Math.random() * 1.5,
    });
  }

  function updateStars() {
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
        s.speed = 0.5 + Math.random() * 1.5;
        s.size = Math.random() * 2 + 0.5;
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = '#0ff';
    for (const s of stars) {
      ctx.globalAlpha = 0.8;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // player (neon circle)
  const player = {
  x: 50,
  y: height / 2,
  radius: 15,
  speed: 4,
  lives: 3,
  color: '#0ff',
  // trail particles will be generated each frame
  particles: []
};

  // obstacles: array of {x, y, w, h}
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames
  const obstacleSpeed = 3;

  let distance = 0; // score
  let running = true;

  // Input handling
  const keys = { ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

function update() {
  // update background stars
  updateStars();

  // Move player
  if (keys.ArrowUp) player.y -= player.speed;
  if (keys.ArrowDown) player.y += player.speed;
  player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

  // generate trail particles
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.5 + 0.5;
    player.particles.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 2,
      life: 1,
      color: '#0ff',
    });
  }

  // update particles
  player.particles = player.particles.filter(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.life -= 0.02;
    return p.life > 0;
  });

  // Spawn obstacles
  if (obstacleTimer <= 0) {
    const obstacleHeight = 30 + Math.random() * 60;
    const y = Math.random() * (height - obstacleHeight);
    obstacles.push({ x: width, y, w: 20, h: obstacleHeight, color: '#f0f' });
    obstacleTimer = obstacleInterval;
  }
  obstacleTimer--;

  // Move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= obstacleSpeed;
    // collision detection
    if (
      player.x + player.radius > o.x &&
      player.x - player.radius < o.x + o.w &&
      player.y + player.radius > o.y &&
      player.y - player.radius < o.y + o.h
    ) {
      player.lives--;
      obstacles.splice(i, 1);
      if (player.lives <= 0) running = false;
      continue;
    }
    // Remove off‑screen obstacles
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  distance += obstacleSpeed;
}
    obstacleTimer--;

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // collision detection
      if (
        player.x + player.radius > o.x &&
        player.x - player.radius < o.x + o.w &&
        player.y + player.radius > o.y &&
        player.y - player.radius < o.y + o.h
      ) {
player.lives--; playCollisionSound();
        obstacles.splice(i, 1);
        if (player.lives <= 0) running = false;
        continue;
      }
      // Remove off‑screen obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    distance += obstacleSpeed;
  }

  function drawNeonCircle(x, y, r, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  function render() {
  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#003');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  // draw stars behind everything
  drawStars();

  // draw particle trail
  ctx.globalAlpha = 1;
  player.particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // draw player
  drawNeonCircle(player.x, player.y, player.radius, player.color);

  // draw obstacles with neon outline
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    // optional neon stroke
    ctx.strokeStyle = o.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  });

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Lives: ${player.lives}`, 10, 20);
  ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 40);
}

  function loop() {
    if (!running) {
      ctx.fillStyle = '#f88';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    render();
    requestAnimationFrame(loop);
  }

  // start game
  loop();
})();
