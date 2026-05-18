// Neon Runner with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  // Enable crisp neon glow
  ctx.imageSmoothingEnabled = false;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const width = canvas.width;
  const height = canvas.height;

  // Player state
  const player = {
    w: 30,
    h: 30,
    x: width * 0.2,
    y: height - 30,
    vy: 0,
    jumpForce: -12,
    gravity: 0.6,
    sliding: false,
    slideTimer: 0,
    color: '#0ff',
  };

  // Obstacles
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames
  let speed = 4; // scroll speed (downwards)
  let frame = 0;
  let running = true;

  const spawnObstacle = () => {
    const w = 30 + Math.random() * 50;
    const h = 30 + Math.random() * 50;
    const x = Math.random() * (width - w);
    obstacles.push({ w, h, x, y: -h, speed: speed + Math.random() * 2 });
  };

  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const handleInput = (e) => {
    if (e.code === 'Space' && player.y >= height - player.h) {
      player.vy = player.jumpForce; // jump
      playTone(440, 0.1); // jump sound
    } else if (e.code === 'ArrowDown' && !player.sliding && player.y >= height - player.h) {
      player.sliding = true;
      player.slideTimer = 15; // frames
      player.h = 15; // reduce height
      playTone(220, 0.1); // slide sound
    }
      player.sliding = true;
      player.slideTimer = 15; // frames
      player.h = 15; // reduce height
    }
  };

  document.addEventListener('keydown', handleInput);

  const update = () => {
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > height - player.h) {
      player.y = height - player.h;
      player.vy = 0;
    }
    if (player.sliding) {
      player.slideTimer--;
      if (player.slideTimer <= 0) {
        player.sliding = false;
        player.h = 30; // restore height
      }
    }
    // obstacles
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.y += obs.speed;
      if (obs.y > height) obstacles.splice(i, 1);
    }
    // collision check
    for (const obs of obstacles) {
      if (rectCollide(player, obs)) {
        running = false;
        // collision sound
        playTone(100, 0.3);
        break;
      }
    }
    // increase difficulty
    if (frame % 600 === 0) speed += 0.5;
    frame++;
  };

  const draw = () => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Neon glow settings
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';

    // Player – neon rounded rectangle
    ctx.fillStyle = player.color;
    const radius = 6;
    ctx.beginPath();
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

    // Obstacles – neon outlines
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f0f';
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth = 3;
    for (const obs of obstacles) {
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }

    // Reset shadow for UI
    ctx.shadowBlur = 0;
  };

  const loop = () => {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // start loop after window loads to ensure canvas size
  if (document.readyState === 'complete') loop(); else window.addEventListener('load', loop);
})();
