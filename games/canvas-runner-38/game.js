// Simple Canvas Runner game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + dur);
  }
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 200;

  const gravity = 0.6;
  const jumpStrength = -12;
  const groundY = height - 30;

  const player = { x: 50, y: groundY, w: 30, h: 30, vy: 0, onGround: true };
  const obstacles = [];
  const clouds = [];
  let frame = 0;
  let score = 0;

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    // Spike base aligns with ground; apex height = size
    obstacles.push({ x: width, y: groundY - size, w: size, h: size });
  }

  function update() {
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    }
    // Obstacles movement and collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 6; // speed
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision with player
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
    }
    // Clouds movement
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= 2; // slower than obstacles
      if (c.x + 80 < 0) clouds.splice(i, 1);
    }
    // Spawn clouds periodically
    if (frame % 180 === 0) {
      const y = Math.random() * (groundY - 80);
      clouds.push({ x: width, y });
    }
    // Spawn obstacles periodically
    if (frame % 120 === 0) {
      spawnObstacle();
      playTone(220, 0.08); // obstacle spawn sound
    }
    frame++;
    score += 0.1;
  }

  function draw() {
    // Background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // Simple moving clouds
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 20, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(c.x + 25, c.y - 20, 25, Math.PI * 1, Math.PI * 1.85);
      ctx.arc(c.x + 55, c.y - 10, 20, Math.PI * 1.37, Math.PI * 1.91);
      ctx.closePath();
      ctx.fill();
    });
    // ground with slight texture
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY + player.h, width, height - groundY - player.h);
    // player as rounded rect
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    const radius = 5;
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // obstacles as spikes (triangles)
    ctx.fillStyle = '#000000';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, groundY + player.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, groundY + player.h);
      ctx.closePath();
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Input
  window.addEventListener('keydown', e => {
    if ((e.code === 'Space' || e.key === ' ') && player.onGround) {
      player.vy = jumpStrength;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  });
  canvas.addEventListener('click', () => {
    if (player.onGround) {
      player.vy = jumpStrength;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  });

  loop();
})();
